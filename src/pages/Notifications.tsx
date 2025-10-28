import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, AlertCircle, Activity, FileText, Loader2, Trash2, Mail, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, isLoading } = useNotifications(user?.id);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications?.filter(n => !n.sent_at)?.length || 0;

  const getNotificationIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-600" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case 'push':
        return <Bell className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sent</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      toast.success('Marked as read');
    } catch (error: any) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('recipient_user_id', user?.id)
        .is('sent_at', null);

      if (error) throw error;
      toast.success('All notifications marked as read');
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      toast.success('Notification deleted');
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = notifications?.filter(n => {
    if (filter === 'unread') return !n.sent_at;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(notifications?.length || 0) - unreadCount}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Tabs defaultValue="all" className="space-y-4" onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>View all your system notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNotifications && filteredNotifications.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <Card 
                        key={notification.id}
                        className={`transition-all ${!notification.sent_at ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1">
                                {getNotificationIcon(notification.channel)}
                              </div>
                              <div className="flex-1 space-y-1">
                                {notification.subject && (
                                  <h4 className="font-semibold text-base">{notification.subject}</h4>
                                )}
                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                  <span>{format(new Date(notification.created_at || ''), 'MMM dd, yyyy HH:mm')}</span>
                                  <span>•</span>
                                  {getStatusBadge(notification.status || 'pending')}
                                  <span>•</span>
                                  <span className="capitalize">{notification.channel}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {!notification.sent_at && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <CheckCheck className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {filter === 'unread' ? 'You have no unread notifications' : 'You have no notifications yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>Notifications that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNotifications && filteredNotifications.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <Card 
                        key={notification.id}
                        className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1">
                                {getNotificationIcon(notification.channel)}
                              </div>
                              <div className="flex-1 space-y-1">
                                {notification.subject && (
                                  <h4 className="font-semibold text-base">{notification.subject}</h4>
                                )}
                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                  <span>{format(new Date(notification.created_at || ''), 'MMM dd, yyyy HH:mm')}</span>
                                  <span>•</span>
                                  {getStatusBadge(notification.status || 'pending')}
                                  <span>•</span>
                                  <span className="capitalize">{notification.channel}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <CheckCheck className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCheck className="h-12 w-12 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">
                    You have no unread notifications
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}