'use client';

import { useEffect } from "react";
import { getPusherClient } from "../../lib/pusher";

const DEFAULT_EVENTS = [
  "notification:new",
  "saved-search:match",
  "booking:status",
  "lead:new",
  "new-message",
];

type RealtimeNotificationListenerProps = {
  userId?: string;
  enabled?: boolean;
  browserAlerts?: boolean;
  onNotification?: (payload: any, eventName: string) => void;
  events?: string[];
};

export function RealtimeNotificationListener({
  userId,
  enabled = true,
  browserAlerts = false,
  onNotification,
  events = DEFAULT_EVENTS,
}: RealtimeNotificationListenerProps) {
  useEffect(() => {
    if (!enabled || !userId) return;

    const pusher = getPusherClient();
    const channelName = `private-user-${userId}`;
    const channel = pusher?.subscribe(channelName);
    if (!channel) return;

    const handleEvent = (payload: any, eventName: string) => {
      onNotification?.(payload, eventName);
      if (!browserAlerts || typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

      const notification = payload?.notification;
      const title = notification?.title || payload?.title || "New notification";
      const body = notification?.body || payload?.body || "You have a new update.";
      new Notification(title, { body });
    };

    const handlers = new Map<string, (payload: any) => void>();
    for (const eventName of events) {
      const handler = (payload: any) => handleEvent(payload, eventName);
      handlers.set(eventName, handler);
      channel.bind(eventName, handler);
    }

    return () => {
      for (const [eventName, handler] of handlers) channel.unbind(eventName, handler);
      pusher.unsubscribe(channelName);
    };
  }, [browserAlerts, enabled, events, onNotification, userId]);

  return null;
}
