/**
 * Serviço de Notificações e Lembretes
 * Gerencia notificações locais para eventos, devoluções e lembretes
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Evento, EntregaFantasia, Lembrete } from './types';

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Inicializar canal de notificações (Android)
export async function initializeNotifications(): Promise<boolean> {
  try {
    // Criar canal no Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notificações Gerais',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });

      await Notifications.setNotificationChannelAsync('eventos', {
        name: 'Eventos e Ensaios',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
      });

      await Notifications.setNotificationChannelAsync('devolucoes', {
        name: 'Devoluções de Material',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
      });
    }

    // Verificar permissões
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Erro ao inicializar notificações:', error);
    return false;
  }
}

// Solicitar permissões de notificação
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissões:', error);
    return false;
  }
}

// Verificar se tem permissão
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

// ============================================
// NOTIFICAÇÕES DE EVENTOS
// ============================================

// Agendar lembrete de evento
export async function scheduleEventReminder(
  evento: Evento,
  minutosAntes: number = 60
): Promise<string | null> {
  try {
    // Parsear data e horário do evento
    const [dia, mes, ano] = evento.data.split('/').map(Number);
    const [hora, minuto] = evento.horario.split(':').map(Number);
    
    const dataEvento = new Date(ano, mes - 1, dia, hora, minuto);
    const dataLembrete = new Date(dataEvento.getTime() - minutosAntes * 60 * 1000);

    // Verificar se a data já passou
    if (dataLembrete <= new Date()) {
      console.log('Data do lembrete já passou');
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📅 ${evento.titulo}`,
        body: `Começa em ${minutosAntes} minutos! Local: ${evento.local}`,
        data: { type: 'evento', eventoId: evento.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dataLembrete,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Erro ao agendar lembrete de evento:', error);
    return null;
  }
}

// Cancelar lembrete de evento
export async function cancelEventReminder(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('Erro ao cancelar lembrete:', error);
  }
}

// ============================================
// NOTIFICAÇÕES DE DEVOLUÇÃO
// ============================================

// Agendar lembrete de devolução
export async function scheduleReturnReminder(
  entrega: EntregaFantasia,
  nomeIntegrante: string,
  nomeMaterial: string,
  diasAtraso: number = 0
): Promise<string | null> {
  try {
    // Agendar para amanhã às 9h
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(9, 0, 0, 0);

    const titulo = diasAtraso > 0 
      ? `⚠️ Devolução Atrasada (${diasAtraso} dias)`
      : '📦 Lembrete de Devolução';

    const corpo = diasAtraso > 0
      ? `${nomeIntegrante} está com "${nomeMaterial}" há ${diasAtraso} dias. Solicite a devolução!`
      : `${nomeIntegrante} está com "${nomeMaterial}". Verifique se precisa devolver.`;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        data: { 
          type: 'devolucao', 
          entregaId: entrega.id,
          integranteId: entrega.integranteId,
          materialId: entrega.materialId,
        },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: amanha,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Erro ao agendar lembrete de devolução:', error);
    return null;
  }
}

// ============================================
// NOTIFICAÇÕES IMEDIATAS
// ============================================

// Enviar notificação imediata
export async function sendImmediateNotification(
  titulo: string,
  corpo: string,
  data?: Record<string, unknown>
): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        data: data || {},
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return null;
  }
}

// ============================================
// LEMBRETES PERSONALIZADOS
// ============================================

// Agendar lembrete personalizado
export async function scheduleLembrete(lembrete: Lembrete): Promise<string | null> {
  try {
    const dataLembrete = new Date(lembrete.dataHora);

    // Verificar se a data já passou
    if (dataLembrete <= new Date()) {
      console.log('Data do lembrete já passou');
      return null;
    }

    // Determinar emoji baseado no tipo
    const emojis: Record<string, string> = {
      evento: '📅',
      devolucao: '📦',
      pagamento: '💰',
      aniversario: '🎂',
      personalizado: '🔔',
    };

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emojis[lembrete.tipo] || '🔔'} ${lembrete.titulo}`,
        body: lembrete.mensagem,
        data: { 
          type: 'lembrete', 
          lembreteId: lembrete.id,
          tipoLembrete: lembrete.tipo,
        },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dataLembrete,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Erro ao agendar lembrete:', error);
    return null;
  }
}

// ============================================
// NOTIFICAÇÕES RECORRENTES
// ============================================

// Agendar lembrete diário
export async function scheduleDailyReminder(
  hora: number,
  minuto: number,
  titulo: string,
  corpo: string
): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hora,
        minute: minuto,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Erro ao agendar lembrete diário:', error);
    return null;
  }
}

// Agendar lembrete semanal
export async function scheduleWeeklyReminder(
  diaSemana: number, // 1 = Domingo, 2 = Segunda, etc.
  hora: number,
  minuto: number,
  titulo: string,
  corpo: string
): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: diaSemana,
        hour: hora,
        minute: minuto,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Erro ao agendar lembrete semanal:', error);
    return null;
  }
}

// ============================================
// GERENCIAMENTO DE NOTIFICAÇÕES
// ============================================

// Listar todas as notificações agendadas
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return [];
  }
}

// Cancelar todas as notificações
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Erro ao cancelar notificações:', error);
  }
}

// Cancelar notificação específica
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('Erro ao cancelar notificação:', error);
  }
}

// Obter badge count
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    return 0;
  }
}

// Definir badge count
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Erro ao definir badge:', error);
  }
}

// Limpar badge
export async function clearBadge(): Promise<void> {
  await setBadgeCount(0);
}

// ============================================
// LISTENERS
// ============================================

// Adicionar listener para notificações recebidas
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Adicionar listener para respostas de notificações
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
