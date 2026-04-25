const { run } = require("../utils/exec");
const alert = require("./alert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Allowed root directory
const ALLOWED_ROOT = "/var/www/";

// Editable file types
const EDITABLE_TYPES = [".html", ".htm", ".js", ".css", ".json", ".txt", ".env", ".yml", ".yaml", ".xml", ".md", ".php", ".py", ".sh", ".conf", ".ini"];

// Restricted file types (system configs)
const RESTRICTED_FILES = ["nginx.conf", "apache2.conf", "sshd_config", "my.cnf", "php.ini"];

// Max upload size (100MB)
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;

// File operations logs
const fileLogs = [];

// Security: Validate path to prevent traversal
function validatePath(filePath) {
  const resolvedPath = path.resolve(filePath);
  const allowedPath = path.resolve(ALLOWED_ROOT);
  
  if (!resolvedPath.startsWith(allowedPath)) {
    throw new Error("Path traversal detected. Access restricted to /var/www/");
  }
  
  return resolvedPath;
}

// Check if file is editable
function isEditable(filename) {
  const ext = path.extname(filename).toLowerCase();
  const basename = path.basename(filename);
  
  if (RESTRICTED_FILES.includes(basename)) {
    return false;
  }
  
  return EDITABLE_TYPES.includes(ext);
}

// Check if file is binary
function isBinary(filename) {
  const binaryExtensions = [".zip", ".tar", ".gz", ".exe", ".bin", ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".mp3", ".mp4", ".woff", ".woff2", ".ttf", ".eot"];
  const ext = path.extname(filename).toLowerCase();
  return binaryExtensions.includes(ext);
}

// Get Directory Contents
async function getDirectoryContents(dirPath) {
  try {
    const validatedPath = validatePath(dirPath);
    
    if (!fs.existsSync(validatedPath)) {
      throw new Error("Directory does not exist");
    }
    
    const items = fs.readdirSync(validatedPath);
    const contents = [];
    
    for (const item of items) {
      const itemPath = path.join(validatedPath, item);
      const stats = fs.statSync(itemPath);
      
      contents.push({
        name: item,
        type: stats.isDirectory() ? "folder" : "file",
        size: stats.size,
        modified: stats.mtime.toISOString(),
        path: itemPath
      });
    }
    
    // Sort: folders first, then files
    contents.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "folder" ? -1 : 1;
    });
    
    return contents;
  } catch (err) {
    alert.warning(`Failed to read directory: ${err}`);
    throw err;
  }
}

// Read File (Preview)
async function readFile(filePath) {
  try {
    const validatedPath = validatePath(filePath);
    
    if (!fs.existsSync(validatedPath)) {
      throw new Error("File does not exist");
    }
    
    const stats = fs.statSync(validatedPath);
    
    if (stats.isDirectory()) {
      throw new Error("Cannot preview directory");
    }
    
    // Block binary files
    if (isBinary(validatedPath)) {
      throw new Error("Cannot preview binary files");
    }
    
    // Check file size (max 10MB for preview)
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error("File too large for preview (max 10MB)");
    }
    
    const content = fs.readFileSync(validatedPath, "utf8");
    
    logFileEvent("file_read", `File read: ${validatedPath}`);
    
    return {
      path: validatedPath,
      content,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      editable: isEditable(path.basename(validatedPath))
    };
  } catch (err) {
    logFileEvent("file_error", `Failed to read file ${filePath}: ${err}`);
    alert.warning(`Failed to read file: ${err}`);
    throw err;
  }
}

// Write File (Edit)
async function writeFile(filePath, content, username = "admin") {
  try {
    const validatedPath = validatePath(filePath);
    
    if (!fs.existsSync(validatedPath)) {
      throw new Error("File does not exist");
    }
    
    const basename = path.basename(validatedPath);
    
    if (!isEditable(basename)) {
      throw new Error("File is not editable (restricted file type)");
    }
    
    // Auto backup before save
    const backupPath = `${validatedPath}.backup.${Date.now()}`;
    fs.copyFileSync(validatedPath, backupPath);
    
    // Write new content
    fs.writeFileSync(validatedPath, content, "utf8");
    
    // Auto sync: reload service if needed
    if (basename.endsWith(".conf") || basename.includes("nginx")) {
      await run("nginx -t");
      await run("systemctl reload nginx");
      alert.info("Nginx reloaded after config change");
    }
    
    logFileEvent("file_written", `File written: ${validatedPath} by ${username}`);
    alert.info(`File saved: ${validatedPath}`);
    
    return {
      path: validatedPath,
      backup: backupPath,
      success: true
    };
  } catch (err) {
    logFileEvent("file_error", `Failed to write file ${filePath}: ${err}`);
    alert.warning(`Failed to write file: ${err}`);
    throw err;
  }
}

// Upload File
async function uploadFile(targetPath, fileData, filename) {
  try {
    const validatedPath = validatePath(targetPath);
    
    if (!fs.existsSync(validatedPath)) {
      throw new Error("Target directory does not exist");
    }
    
    // Validate file size
    if (fileData.size > MAX_UPLOAD_SIZE) {
      throw new Error(`File too large (max ${MAX_UPLOAD_SIZE / 1024 / 1024}MB)`);
    }
    
    const destination = path.join(validatedPath, filename);
    
    // Write file
    fs.writeFileSync(destination, fileData.buffer);
    
    // Set permissions
    await run(`chmod 644 ${destination}`);
    await run(`chown www-data:www-data ${destination}`);
    
    logFileEvent("file_uploaded", `File uploaded: ${destination}`);
    alert.info(`File uploaded: ${destination}`);
    
    return {
      path: destination,
      size: fileData.size,
      success: true
    };
  } catch (err) {
    logFileEvent("file_error", `Failed to upload file: ${err}`);
    alert.warning(`Failed to upload file: ${err}`);
    throw err;
  }
}

// Create File
async function createFile(filePath, content = "") {
  try {
    const validatedPath = validatePath(filePath);
    
    if (fs.existsSync(validatedPath)) {
      throw new Error("File already exists");
    }
    
    fs.writeFileSync(validatedPath, content, "utf8");
    await run(`chmod 644 ${validatedPath}`);
    await run(`chown www-data:www-data ${validatedPath}`);
    
    logFileEvent("file_created", `File created: ${validatedPath}`);
    alert.info(`File created: ${validatedPath}`);
    
    return {
      path: validatedPath,
      success: true
    };
  } catch (err) {
    logFileEvent("file_error", `Failed to create file ${filePath}: ${err}`);
    alert.warning(`Failed to create file: ${err}`);
    throw err;
  }
}

// Create Folder
async function createFolder(folderPath) {
  try {
    const validatedPath = validatePath(folderPath);
    
    if (fs.existsSync(validatedPath)) {
      throw new Error("Folder already exists");
    }
    
    fs.mkdirSync(validatedPath, { recursive: true });
    await run(`chmod 755 ${validatedPath}`);
    await run(`chown www-data:www-data ${validatedPath}`);
    
    logFileEvent("folder_created", `Folder created: ${validatedPath}`);
    alert.info(`Folder created: ${validatedPath}`);
    
    return {
      path: validatedPath,
      success: true
    };
  } catch (err) {
    logFileEvent("file_error", `Failed to create folder ${folderPath}: ${err}`);
    alert.warning(`Failed to create folder: ${err}`);
    throw err;
  }
}

// Delete File/Folder
async function deleteItem(itemPath, softDelete = false) {
  try {
    const validatedPath = validatePath(itemPath);
    
    if (!fs.existsSync(validatedPath)) {
      throw new Error("Item does not exist");
    }
    
    if (softDelete) {
      // Move to trash instead of permanent delete
      const trashPath = `/var/www/.trash/${Date.now()}_${path.basename(validatedPath)}`;
      await run(`mkdir -p /var/www/.trash`);
      await run(`mv ${validatedPath} ${trashPath}`);
      
      logFileEvent("item_soft_deleted", `Item soft deleted: ${validatedPath} -> ${trashPath}`);
      alert.info(`Item moved to trash: ${validatedPath}`);
      
      return {
        path: validatedPath,
        trashPath,
        success: true
      };
    } else {
      // Permanent delete
      const stats = fs.statSync(validatedPath);
      
      if (stats.isDirectory()) {
        await run(`rm -rf ${validatedPath}`);
      } else {
        fs.unlinkSync(validatedPath);
      }
      
      logFileEvent("item_deleted", `Item deleted: ${validatedPath}`);
      alert.warning(`Item deleted: ${validatedPath}`);
      
      return {
        path: validatedPath,
        success: true
      };
    }
  } catch (err) {
    logFileEvent("file_error", `Failed to delete item ${itemPath}: ${err}`);
    alert.warning(`Failed to delete item: ${err}`);
    throw err;
  }
}

// Rename File/Folder
async function renameItem(oldPath, newName) {
  try {
    const validatedOldPath = validatePath(oldPath);
    const dir = path.dirname(validatedOldPath);
    const newPath = path.join(dir, newName);
    const validatedNewPath = validatePath(newPath);
    
    if (!fs.existsSync(validatedOldPath)) {
      throw new Error("Item does not exist");
    }
    
    if (fs.existsSync(validatedNewPath)) {
      throw new Error("Target name already exists");
    }
    
    fs.renameSync(validatedOldPath, validatedNewPath);
    
    logFileEvent("item_renamed", `Item renamed: ${validatedOldPath} -> ${validatedNewPath}`);
    alert.info(`Item renamed: ${path.basename(validatedOldPath)} -> ${newName}`);
    
    return {
      oldPath: validatedOldPath,
      newPath: validatedNewPath,
      success: true
    };
  } catch (err) {
    logFileEvent("file_error", `Failed to rename item ${oldPath}: ${err}`);
    alert.warning(`Failed to rename item: ${err}`);
    throw err;
  }
}

// Get File Info
async function getFileInfo(filePath) {
  try {
    const validatedPath = validatePath(filePath);
    
    if (!fs.existsSync(validatedPath)) {
      throw new Error("Item does not exist");
    }
    
    const stats = fs.statSync(validatedPath);
    
    return {
      path: validatedPath,
      name: path.basename(validatedPath),
      type: stats.isDirectory() ? "folder" : "file",
      size: stats.size,
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString(),
      permissions: stats.mode.toString(8),
      editable: !stats.isDirectory() && isEditable(path.basename(validatedPath))
    };
  } catch (err) {
    alert.warning(`Failed to get file info: ${err}`);
    throw err;
  }
}

// Permission Check
function checkPermission(username, role) {
  // Only Admin and Server Manager can access file manager
  if (role !== "admin" && role !== "server_manager") {
    throw new Error("Permission denied. Only Admin and Server Manager can access file manager");
  }
  return true;
}

// Search Files
async function searchFiles(searchPath, pattern) {
  try {
    const validatedPath = validatePath(searchPath);
    const results = [];
    
    const searchDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          searchDir(itemPath);
        } else if (item.toLowerCase().includes(pattern.toLowerCase())) {
          results.push({
            name: item,
            path: itemPath,
            size: stats.size
          });
        }
      }
    };
    
    searchDir(validatedPath);
    
    return results;
  } catch (err) {
    alert.warning(`Failed to search files: ${err}`);
    return [];
  }
}

// Compress Files/Folders
async function compressItem(itemPath) {
  try {
    const validatedPath = validatePath(itemPath);
    
    if (!fs.existsSync(validatedPath)) {
      throw new Error("Item does not exist");
    }
    
    const stats = fs.statSync(validatedPath);
    const basename = path.basename(validatedPath);
    const zipPath = `${validatedPath}.zip`;
    
    if (stats.isDirectory()) {
      await run(`cd ${path.dirname(validatedPath)} && zip -r ${zipPath} ${basename}`);
    } else {
      await run(`zip ${zipPath} ${validatedPath}`);
    }
    
    logFileEvent("item_compressed", `Item compressed: ${validatedPath} -> ${zipPath}`);
    alert.info(`Item compressed: ${zipPath}`);
    
    return {
      path: validatedPath,
      zipPath,
      success: true
    };
  } catch (err) {
    logFileEvent("file_error", `Failed to compress item ${itemPath}: ${err}`);
    alert.warning(`Failed to compress item: ${err}`);
    throw err;
  }
}

// Extract Files
async function extractItem(zipPath, targetDir) {
  try {
    const validatedZipPath = validatePath(zipPath);
    const validatedTargetDir = validatePath(targetDir);
    
    if (!fs.existsSync(validatedZipPath)) {
      throw new Error("Zip file does not exist");
    }
    
    await run(`unzip -o ${validatedZipPath} -d ${validatedTargetDir}`);
    
    logFileEvent("item_extracted", `Item extracted: ${validatedZipPath} -> ${validatedTargetDir}`);
    alert.info(`Item extracted to: ${validatedTargetDir}`);
    
    return {
      path: validatedZipPath,
      targetDir: validatedTargetDir,
      success: true
    };
  } catch (err) {
    logFileEvent("file_error", `Failed to extract item ${zipPath}: ${err}`);
    alert.warning(`Failed to extract item: ${err}`);
    throw err;
  }
}

// Logging
function logFileEvent(type, message) {
  fileLogs.push({
    type,
    message,
    timestamp: new Date().toISOString()
  });
  
  if (fileLogs.length > 1000) {
    fileLogs.shift();
  }
}

async function getFileLogs(limit = 100) {
  return fileLogs.slice(-limit).reverse();
}

// Edge Case: Stream large file
async function streamFile(filePath) {
  try {
    const validatedPath = validatePath(filePath);
    
    if (!fs.existsSync(validatedPath)) {
      throw new Error("File does not exist");
    }
    
    const stats = fs.statSync(validatedPath);
    
    if (stats.size > 50 * 1024 * 1024) {
      // For files > 50MB, return stream info instead of content
      return {
        path: validatedPath,
        size: stats.size,
        stream: true,
        message: "File too large for direct read, use streaming"
      };
    }
    
    return await readFile(filePath);
  } catch (err) {
    alert.warning(`Failed to stream file: ${err}`);
    throw err;
  }
}

// Get Disk Usage
async function getDiskUsage(path = "/var/www/") {
  try {
    const validatedPath = validatePath(path);
    const duOutput = await run(`du -sh ${validatedPath}`);
    const dfOutput = await run(`df -h ${validatedPath}`);
    
    return {
      path: validatedPath,
      used: duOutput.split('\t')[0],
      available: dfOutput.split('\n')[1].split(/\s+/)[3]
    };
  } catch (err) {
    alert.warning(`Failed to get disk usage: ${err}`);
    return {};
  }
}

// Exports
exports.getDirectoryContents = getDirectoryContents;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.uploadFile = uploadFile;
exports.createFile = createFile;
exports.createFolder = createFolder;
exports.deleteItem = deleteItem;
exports.renameItem = renameItem;
exports.getFileInfo = getFileInfo;
exports.checkPermission = checkPermission;
exports.searchFiles = searchFiles;
exports.compressItem = compressItem;
exports.extractItem = extractItem;
exports.getFileLogs = getFileLogs;
exports.streamFile = streamFile;
exports.getDiskUsage = getDiskUsage;
exports.ALLOWED_ROOT = ALLOWED_ROOT;
exports.EDITABLE_TYPES = EDITABLE_TYPES;
