import { getUserProfile, getTransactions } from '../db/storage';

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones Web/Push.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body: options?.body || 'Mantén tu cuenta al día con FinanAI',
            icon: '/pwa-192x192.png',
            badge: '/icon.svg',
            tag: 'finan-ai-reminder',
            ...options
          });
        });
      } else {
        new Notification(title, {
          body: options?.body || 'Mantén tu cuenta al día con FinanAI',
          icon: '/icon.svg',
          ...options
        });
      }
    } catch (e) {
      console.error('Error sending local notification:', e);
    }
  }
}

export function testPushNotification() {
  const profile = getUserProfile();
  sendLocalNotification('🔔 FinanAI - Recordatorio Diario', {
    body: `¡Hola ${profile.name}! No olvides registrar tus compras de hoy (comida, gasolina, cerveza, etc.).`,
    tag: 'test-push-reminder'
  });
}

// Automatic Daily Check
export function checkDailyReminder() {
  const profile = getUserProfile();
  if (!profile.pushEnabled) return;

  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];

  // If already checked today, skip
  if (profile.lastReminderCheck === todayKey) return;

  const [targetHourStr, targetMinStr] = (profile.reminderTime || '20:00').split(':');
  const targetHour = parseInt(targetHourStr, 10) || 20;

  if (now.getHours() >= targetHour) {
    const txs = getTransactions();
    const hasTransactionsToday = txs.some(t => t.date.startsWith(todayKey));

    if (!hasTransactionsToday) {
      sendLocalNotification('📝 Recordatorio de Gastos del Día', {
        body: `¡Hola ${profile.name}! Hoy aún no has registrado tus gastos o ingresos. Escríbele a FinanAI para actualizar tu cuenta.`,
        tag: 'daily-reminder'
      });
    }
  }
}
