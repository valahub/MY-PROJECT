import { Link, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, ChevronRight, Eye, MessageCircle, Send } from "lucide-react";
import { 
  FORUM_CATEGORIES, 
  getForumCategoryBySlug, 
  getTopicsByCategory,
  getTopicById,
  getRepliesByTopic,
  type ForumCategory,
  type ForumTopic,
  type ForumReply 
} from "@/lib/forum-data";

function ForumsPage() {
  const { slug, topicId } = useParams();
  const category = slug ? getForumCategoryBySlug(slug) : undefined;
  const topic = topicId ? getTopicById(topicId) : undefined;
  const replies = topicId ? getRepliesByTopic(topicId) : [];

  // If no slug, show category list
  if (!slug) {
    const generalCategories = FORUM_CATEGORIES.filter((cat) => cat.type === 'general');
    const techCategories = FORUM_CATEGORIES.filter((cat) => cat.type === 'tech');

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Forums</h1>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Topic
          </Button>
        </div>

        {/* General Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">General</h2>
          <div className="space-y-2">
            {generalCategories.map((cat) => (
              <Link key={cat.id} to={`/marketplace/forums/${cat.slug}`}>
                <Card className="hover:border-primary cursor-pointer transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{cat.name}</div>
                      <div className="text-xs text-muted-foreground">{cat.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cat.topics.toLocaleString()} topics · {cat.posts.toLocaleString()} posts
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Last: {cat.lastActivity}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Tech Categories */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Technical</h2>
          <div className="space-y-2">
            {techCategories.map((cat) => (
              <Link key={cat.id} to={`/marketplace/forums/${cat.slug}`}>
                <Card className="hover:border-primary cursor-pointer transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{cat.name}</div>
                      <div className="text-xs text-muted-foreground">{cat.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cat.topics.toLocaleString()} topics · {cat.posts.toLocaleString()} posts
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Last: {cat.lastActivity}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If slug exists but category not found, redirect
  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Forum Category Not Found</h1>
          <Link to="/marketplace/forums">
            <Button>Back to Forums</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If topicId exists, show topic detail
  if (topicId) {
    if (!topic) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Topic Not Found</h1>
            <Link to={`/marketplace/forums/${slug}`}>
              <Button>Back to Category</Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/marketplace/forums" className="hover:text-foreground transition-colors">
            Forums
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/marketplace/forums/${slug}`} className="hover:text-foreground transition-colors">
            {category.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{topic.title}</span>
        </div>

        {/* Topic Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-2">{topic.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>by {topic.author}</span>
              <span>·</span>
              <span>{topic.createdAt}</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{topic.replies} replies</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{topic.views} views</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          {replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {reply.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{reply.author}</span>
                      <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
                    </div>
                    <p className="text-sm">{reply.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply Box */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Post a Reply</h3>
            <Textarea
              placeholder="Write your reply..."
              className="mb-4"
              rows={4}
            />
            <Button size="sm">
              <Send className="h-4 w-4 mr-2" />
              Post Reply
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show topic list for category
  const topics = getTopicsByCategory(category.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/marketplace/forums" className="hover:text-foreground transition-colors">
          Forums
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{category.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Topic
        </Button>
      </div>

      {/* Topics List */}
      {topics.length > 0 ? (
        <div className="space-y-2">
          {topics.map((topic) => (
            <Link key={topic.id} to={`/marketplace/forums/${slug}/${topic.id}`}>
              <Card className="hover:border-primary cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{topic.title}</div>
                      <div className="text-xs text-muted-foreground">
                        by {topic.author} · {topic.createdAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{topic.replies}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{topic.views}</span>
                      </div>
                      <div>Last: {topic.lastActivity}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Be the first to start a conversation in this category.</p>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Topic
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ForumsPage;
