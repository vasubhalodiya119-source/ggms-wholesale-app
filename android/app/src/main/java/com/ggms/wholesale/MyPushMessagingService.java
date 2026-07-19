package com.ggms.wholesale;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.RemoteMessage;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import java.util.Map;

public class MyPushMessagingService extends MessagingService {
    private static final String CHANNEL_ID = "ggms_notifications";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        sendCustomNotification(remoteMessage);
    }

    private void sendCustomNotification(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (data == null || data.isEmpty()) return;

        String type = data.get("type");
        String orderId = data.get("order_id");
        String customerShopId = data.get("customer_shop_id");
        String url = data.get("url");

        String title = data.get("title");
        String body = data.get("body");
        if (body == null) body = data.get("message");

        if (title == null || title.isEmpty()) title = "GGM&S Wholesale 🛍️";
        if (body == null || body.isEmpty()) body = "તમારી પાસે નવો સંદેશ છે.";

        int notificationId = (int) (System.currentTimeMillis() & 0xfffffff);

        // Intent when tapping the notification itself (opens app)
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (url != null) {
            intent.putExtra("url", url);
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        int iconResId = android.R.drawable.ic_dialog_info;
        try {
            int appIconId = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
            if (appIconId != 0) {
                iconResId = appIconId;
            }
        } catch (Exception e) {
            // Fallback used
        }

        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(iconResId)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(pendingIntent);

        // Add 3 native action buttons if message type is new_order
        if ("new_order".equals(type) && orderId != null && !orderId.isEmpty()) {
            Intent acceptIntent = new Intent(this, NotificationActionReceiver.class);
            acceptIntent.setAction("ACCEPT");
            acceptIntent.putExtra("order_id", orderId);
            acceptIntent.putExtra("customer_shop_id", customerShopId);
            acceptIntent.putExtra("notification_id", notificationId);
            PendingIntent acceptPendingIntent = PendingIntent.getBroadcast(
                    this,
                    notificationId + 1,
                    acceptIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Intent pendingActionIntent = new Intent(this, NotificationActionReceiver.class);
            pendingActionIntent.setAction("PENDING");
            pendingActionIntent.putExtra("order_id", orderId);
            pendingActionIntent.putExtra("customer_shop_id", customerShopId);
            pendingActionIntent.putExtra("notification_id", notificationId);
            PendingIntent pendingPendingIntent = PendingIntent.getBroadcast(
                    this,
                    notificationId + 2,
                    pendingActionIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Intent declineIntent = new Intent(this, NotificationActionReceiver.class);
            declineIntent.setAction("DECLINE");
            declineIntent.putExtra("order_id", orderId);
            declineIntent.putExtra("customer_shop_id", customerShopId);
            declineIntent.putExtra("notification_id", notificationId);
            PendingIntent declinePendingIntent = PendingIntent.getBroadcast(
                    this,
                    notificationId + 3,
                    declineIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            notificationBuilder
                    .addAction(android.R.drawable.ic_media_play, "✅ Accept", acceptPendingIntent)
                    .addAction(android.R.drawable.ic_media_pause, "⏳ Pending", pendingPendingIntent)
                    .addAction(android.R.drawable.ic_delete, "❌ Decline", declinePendingIntent);
        }

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "GGM&S Order Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.enableVibration(true);
            channel.enableLights(true);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            notificationManager.createNotificationChannel(channel);
        }

        notificationManager.notify(notificationId, notificationBuilder.build());
    }
}
