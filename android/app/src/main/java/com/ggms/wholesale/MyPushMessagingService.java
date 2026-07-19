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
        Map<String, String> data = remoteMessage.getData();
        String type = data.get("type");

        if ("new_order".equals(type)) {
            sendCustomNotification(remoteMessage);
        } else {
            super.onMessageReceived(remoteMessage);
        }
    }

    private void sendCustomNotification(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        String orderId = data.get("order_id");
        String customerShopId = data.get("customer_shop_id");
        String url = data.get("url");

        String title = remoteMessage.getNotification() != null ? remoteMessage.getNotification().getTitle() : data.get("title");
        String body = remoteMessage.getNotification() != null ? remoteMessage.getNotification().getBody() : data.get("message");

        if (title == null) title = "નવો ઓર્ડર! 🛍️";
        if (body == null) body = "નવો ઓર્ડર મળેલ છે.";

        // Intent when tapping the notification itself (opens app)
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("url", url);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, (int) System.currentTimeMillis(), intent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);

        // Actions PendingIntents
        Intent acceptIntent = new Intent(this, NotificationActionReceiver.class);
        acceptIntent.setAction("ACCEPT");
        acceptIntent.putExtra("order_id", orderId);
        acceptIntent.putExtra("customer_shop_id", customerShopId);
        acceptIntent.putExtra("notification_id", 1001); // Unique notification ID
        PendingIntent acceptPendingIntent = PendingIntent.getBroadcast(this, 1, acceptIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent pendingActionIntent = new Intent(this, NotificationActionReceiver.class);
        pendingActionIntent.setAction("PENDING");
        pendingActionIntent.putExtra("order_id", orderId);
        pendingActionIntent.putExtra("customer_shop_id", customerShopId);
        pendingActionIntent.putExtra("notification_id", 1001);
        PendingIntent pendingPendingIntent = PendingIntent.getBroadcast(this, 2, pendingActionIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent declineIntent = new Intent(this, NotificationActionReceiver.class);
        declineIntent.setAction("DECLINE");
        declineIntent.putExtra("order_id", orderId);
        declineIntent.putExtra("customer_shop_id", customerShopId);
        declineIntent.putExtra("notification_id", 1001);
        PendingIntent declinePendingIntent = PendingIntent.getBroadcast(this, 3, declineIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        
        // Use android built-in notification icon
        int iconResId = android.R.drawable.ic_dialog_info;
        try {
            // Attempt to resolve ic_launcher if available
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
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .addAction(android.R.drawable.ic_media_play, "Accept", acceptPendingIntent)
                .addAction(android.R.drawable.ic_media_pause, "Pending", pendingPendingIntent)
                .addAction(android.R.drawable.ic_delete, "Decline", declinePendingIntent);

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                    "GGM&S Announcements",
                    NotificationManager.IMPORTANCE_HIGH);
            notificationManager.createNotificationChannel(channel);
        }

        notificationManager.notify(1001, notificationBuilder.build());
    }
}
