import PusherServer from "pusher";
import PusherClient from "pusher-js";

const pusherConfig = {
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
};

export const isPusherConfigured = Boolean(
  pusherConfig.appId && pusherConfig.key && pusherConfig.secret && pusherConfig.cluster,
);

export const pusherServer = isPusherConfigured
  ? new PusherServer({
      appId: pusherConfig.appId!,
      key: pusherConfig.key!,
      secret: pusherConfig.secret!,
      cluster: pusherConfig.cluster!,
      useTLS: true,
    })
  : null;

let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (typeof window === "undefined" || !pusherConfig.key || !pusherConfig.cluster) {
    return null;
  }

  if (!pusherClientInstance) {
    try {
      if (process.env.NODE_ENV !== "production") {
        PusherClient.logToConsole = true;
      }
      pusherClientInstance = new PusherClient(pusherConfig.key, {
        cluster: pusherConfig.cluster,
        authEndpoint: "/api/pusher/auth",
      });
    } catch (error) {
      console.error("Pusher client unavailable:", error);
      return null;
    }
  }

  return pusherClientInstance;
};
