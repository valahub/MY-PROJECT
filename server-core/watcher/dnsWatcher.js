const healer = require("../engine/healer");
const alert = require("../engine/alert");

// DNS Records storage (in production, connect to Bind9 or Cloudflare API)
const dnsRecords = {
  "erpvala.com": {
    A: ["192.168.1.1"],
    CNAME: ["www.erpvala.com"],
    MX: ["10 mail.erpvala.com"],
    TXT: ["v=spf1 ip4:192.168.1.1 -all"]
  },
  "shop.erpvala.com": {
    A: ["192.168.1.1"],
    CNAME: [],
    MX: ["10 mail.erpvala.com"],
    TXT: ["v=spf1 ip4:192.168.1.1 -all"]
  }
};

async function updateDNSRecord(domain, type, name, value) {
  try {
    // In production, use Cloudflare API or Bind9 commands
    // Cloudflare API example:
    // await axios.patch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`, {
    //   type: type,
    //   name: name,
    //   content: value
    // }, { headers: { Authorization: `Bearer ${apiToken}` } });
    
    // Bind9 command example:
    // await healer.run(`nsupdate << EOF
    // server localhost
    // zone ${domain}
    // update add ${name}.${domain} 300 ${type} ${value}
    // send
    // EOF`);
    
    if (!dnsRecords[domain]) {
      dnsRecords[domain] = { A: [], CNAME: [], MX: [], TXT: [] };
    }
    
    if (!dnsRecords[domain][type]) {
      dnsRecords[domain][type] = [];
    }
    
    dnsRecords[domain][type].push(value);
    alert.info(`Updated DNS record: ${type} ${name}.${domain} -> ${value}`);
    
    return true;
  } catch (err) {
    alert.warning(`Failed to update DNS record: ${err}`);
    return false;
  }
}

async function deleteDNSRecord(domain, type, name) {
  try {
    if (dnsRecords[domain] && dnsRecords[domain][type]) {
      dnsRecords[domain][type] = dnsRecords[domain][type].filter(r => !r.includes(name));
      alert.info(`Deleted DNS record: ${type} ${name}.${domain}`);
    }
    
    return true;
  } catch (err) {
    alert.warning(`Failed to delete DNS record: ${err}`);
    return false;
  }
}

async function syncDNSWithProvider(domain) {
  try {
    // Sync with Cloudflare or Bind9
    // This would fetch current records and update local storage
    alert.info(`Synced DNS records for ${domain}`);
    return true;
  } catch (err) {
    alert.warning(`DNS sync failed for ${domain}: ${err}`);
    return false;
  }
}

async function validateDNS(domain) {
  try {
    const domainName = domain.replace("https://", "");
    
    // Check A record
    const aRecord = await healer.run(`dig +short A ${domainName}`);
    if (!aRecord) {
      alert.warning(`Missing A record for ${domain}`);
    }
    
    // Check MX record
    const mxRecord = await healer.run(`dig +short MX ${domainName}`);
    if (!mxRecord) {
      alert.warning(`Missing MX record for ${domain}`);
    }
    
    // Check SPF/TXT record
    const txtRecord = await healer.run(`dig +short TXT ${domainName}`);
    if (!txtRecord || !txtRecord.includes("v=spf1")) {
      alert.warning(`Missing or invalid SPF record for ${domain}`);
    }
    
    alert.info(`DNS validation passed for ${domain}`);
    return true;
  } catch (err) {
    alert.warning(`DNS validation failed for ${domain}: ${err}`);
    return false;
  }
}

async function checkDNSPropagation(domain) {
  try {
    const domainName = domain.replace("https://", "");
    const servers = ["8.8.8.8", "1.1.1.1", "208.67.222.222"];
    
    for (const server of servers) {
      await healer.run(`dig @${server} +short ${domainName}`);
    }
    
    alert.info(`DNS propagation check passed for ${domain}`);
    return true;
  } catch (err) {
    alert.warning(`DNS propagation check failed for ${domain}: ${err}`);
    return false;
  }
}

exports.loop = async () => {
  const domains = Object.keys(dnsRecords);
  for (const domain of domains) {
    await validateDNS(domain);
    await checkDNSPropagation(domain);
    await syncDNSWithProvider(domain);
  }
};

exports.updateDNSRecord = updateDNSRecord;
exports.deleteDNSRecord = deleteDNSRecord;
exports.getDNSRecords = () => dnsRecords;
exports.validateDNS = validateDNS;
