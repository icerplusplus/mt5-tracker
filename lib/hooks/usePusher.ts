"use client";

import { useEffect } from 'react';
import { getPusherClient } from '@/lib/pusher/client';
import type { Channel } from 'pusher-js';

export function usePusher() {
  const pusher = getPusherClient();
  
  return pusher;
}

export function usePusherChannel(channelName: string) {
  const pusher = usePusher();
  let channel: Channel | null = null;
  
  useEffect(() => {
    channel = pusher.subscribe(channelName);
    
    console.log(`📡 Subscribed to channel: ${channelName}`);
    
    return () => {
      if (channel) {
        pusher.unsubscribe(channelName);
        console.log(`📡 Unsubscribed from channel: ${channelName}`);
      }
    };
  }, [channelName, pusher]);
  
  return channel;
}

export function usePusherEvent(
  channelName: string,
  eventName: string,
  callback: (data: any) => void
) {
  const pusher = usePusher();
  
  useEffect(() => {
    const channel = pusher.subscribe(channelName);
    
    channel.bind(eventName, callback);
    
    console.log(`📡 Listening to ${channelName}:${eventName}`);
    
    return () => {
      channel.unbind(eventName, callback);
      pusher.unsubscribe(channelName);
    };
  }, [channelName, eventName, callback, pusher]);
}
