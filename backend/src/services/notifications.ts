import { Types } from 'mongoose';
import {
  Notification,
  PlayerNotification,
  type INotification,
  type IPlayerNotification,
} from '../models/Notification';
import { Player, type IPlayer } from '../models/Player';
import { getMemoryPlayers, isUsingMemory, persistPlayer } from './gameState';

type SendInput = {
  title: string;
  body: string;
  targetType: 'all' | 'device';
  targetDeviceId?: string | null;
};

export type InboxItem = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

type MemoryNotif = {
  id: string;
  title: string;
  body: string;
  targetType: 'all' | 'device';
  targetDeviceId: string | null;
  createdAt: Date;
};

type MemoryInbox = {
  id: string;
  deviceId: string;
  notificationId: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

const memoryNotifications: MemoryNotif[] = [];
const memoryInbox: MemoryInbox[] = [];

function toastFrom(title: string, body: string): string {
  const text = `${title}: ${body}`.trim();
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

async function applyToast(deviceIds: string[], message: string): Promise<void> {
  if (isUsingMemory()) {
    for (const deviceId of deviceIds) {
      const player = getMemoryPlayers().get(deviceId);
      if (player) {
        player.toastMessage = message;
        await persistPlayer(player);
      }
    }
    return;
  }

  await Player.updateMany(
    { deviceId: { $in: deviceIds }, status: { $ne: 'banned' } },
    { $set: { toastMessage: message } },
  );
}

export async function sendNotification(input: SendInput): Promise<{
  notification: {
    id: string;
    title: string;
    body: string;
    targetType: 'all' | 'device';
    targetDeviceId: string | null;
    createdAt: string;
    delivered: number;
  };
}> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) {
    throw Object.assign(new Error('عنوان و متن الزامی است'), { status: 400 });
  }

  if (input.targetType === 'device') {
    const deviceId = input.targetDeviceId?.trim();
    if (!deviceId) {
      throw Object.assign(new Error('شناسه دستگاه الزامی است'), { status: 400 });
    }

    if (isUsingMemory()) {
      const player = getMemoryPlayers().get(deviceId);
      if (!player) {
        throw Object.assign(new Error('بازیکن پیدا نشد'), { status: 404 });
      }
      const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const createdAt = new Date();
      memoryNotifications.unshift({
        id,
        title,
        body,
        targetType: 'device',
        targetDeviceId: deviceId,
        createdAt,
      });
      memoryInbox.unshift({
        id: `i-${id}`,
        deviceId,
        notificationId: id,
        title,
        body,
        readAt: null,
        createdAt,
      });
      await applyToast([deviceId], toastFrom(title, body));
      return {
        notification: {
          id,
          title,
          body,
          targetType: 'device',
          targetDeviceId: deviceId,
          createdAt: createdAt.toISOString(),
          delivered: 1,
        },
      };
    }

    const player = await Player.findOne({ deviceId });
    if (!player) {
      throw Object.assign(new Error('بازیکن پیدا نشد'), { status: 404 });
    }

    const notification = await Notification.create({
      title,
      body,
      targetType: 'device',
      targetDeviceId: deviceId,
    });

    await PlayerNotification.create({
      deviceId,
      notificationId: notification._id,
      title,
      body,
      readAt: null,
    });

    await applyToast([deviceId], toastFrom(title, body));

    return {
      notification: {
        id: String(notification._id),
        title,
        body,
        targetType: 'device',
        targetDeviceId: deviceId,
        createdAt: notification.createdAt.toISOString(),
        delivered: 1,
      },
    };
  }

  // Broadcast to all
  if (isUsingMemory()) {
    const players = [...getMemoryPlayers().values()].filter((p) => p.status !== 'banned');
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date();
    memoryNotifications.unshift({
      id,
      title,
      body,
      targetType: 'all',
      targetDeviceId: null,
      createdAt,
    });
    for (const player of players) {
      memoryInbox.unshift({
        id: `i-${id}-${player.deviceId}`,
        deviceId: player.deviceId,
        notificationId: id,
        title,
        body,
        readAt: null,
        createdAt,
      });
    }
    await applyToast(
      players.map((p) => p.deviceId),
      toastFrom(title, body),
    );
    return {
      notification: {
        id,
        title,
        body,
        targetType: 'all',
        targetDeviceId: null,
        createdAt: createdAt.toISOString(),
        delivered: players.length,
      },
    };
  }

  const players = await Player.find({ status: { $ne: 'banned' } })
    .select('deviceId')
    .lean();
  const notification = await Notification.create({
    title,
    body,
    targetType: 'all',
    targetDeviceId: null,
  });

  if (players.length > 0) {
    await PlayerNotification.insertMany(
      players.map((p) => ({
        deviceId: p.deviceId,
        notificationId: notification._id,
        title,
        body,
        readAt: null,
      })),
      { ordered: false },
    );
    await applyToast(
      players.map((p) => p.deviceId),
      toastFrom(title, body),
    );
  }

  return {
    notification: {
      id: String(notification._id),
      title,
      body,
      targetType: 'all',
      targetDeviceId: null,
      createdAt: notification.createdAt.toISOString(),
      delivered: players.length,
    },
  };
}

export async function listAdminNotifications(limit = 50): Promise<
  Array<{
    id: string;
    title: string;
    body: string;
    targetType: 'all' | 'device';
    targetDeviceId: string | null;
    createdAt: string;
  }>
> {
  if (isUsingMemory()) {
    return memoryNotifications.slice(0, limit).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      targetType: n.targetType,
      targetDeviceId: n.targetDeviceId,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  const docs = await Notification.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return docs.map((n) => ({
    id: String(n._id),
    title: n.title,
    body: n.body,
    targetType: n.targetType,
    targetDeviceId: n.targetDeviceId,
    createdAt: new Date(n.createdAt).toISOString(),
  }));
}

export async function getPlayerInbox(deviceId: string): Promise<{
  items: InboxItem[];
  unreadCount: number;
}> {
  if (isUsingMemory()) {
    const items = memoryInbox
      .filter((i) => i.deviceId === deviceId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50)
      .map((i) => ({
        id: i.id,
        title: i.title,
        body: i.body,
        readAt: i.readAt ? i.readAt.toISOString() : null,
        createdAt: i.createdAt.toISOString(),
      }));
    return {
      items,
      unreadCount: items.filter((i) => !i.readAt).length,
    };
  }

  const docs = await PlayerNotification.find({ deviceId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const items = docs.map((d) => ({
    id: String(d._id),
    title: d.title,
    body: d.body,
    readAt: d.readAt ? new Date(d.readAt).toISOString() : null,
    createdAt: new Date(d.createdAt).toISOString(),
  }));

  return {
    items,
    unreadCount: items.filter((i) => !i.readAt).length,
  };
}

export async function markInboxRead(
  deviceId: string,
  inboxId: string,
): Promise<InboxItem> {
  if (isUsingMemory()) {
    const item = memoryInbox.find((i) => i.id === inboxId && i.deviceId === deviceId);
    if (!item) {
      throw Object.assign(new Error('پیام پیدا نشد'), { status: 404 });
    }
    item.readAt = item.readAt || new Date();
    return {
      id: item.id,
      title: item.title,
      body: item.body,
      readAt: item.readAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    };
  }

  if (!Types.ObjectId.isValid(inboxId)) {
    throw Object.assign(new Error('شناسه نامعتبر'), { status: 400 });
  }

  const doc = await PlayerNotification.findOneAndUpdate(
    { _id: inboxId, deviceId },
    { $set: { readAt: new Date() } },
    { new: true },
  );

  if (!doc) {
    throw Object.assign(new Error('پیام پیدا نشد'), { status: 404 });
  }

  return {
    id: String(doc._id),
    title: doc.title,
    body: doc.body,
    readAt: doc.readAt ? doc.readAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export type { INotification, IPlayerNotification, IPlayer };
