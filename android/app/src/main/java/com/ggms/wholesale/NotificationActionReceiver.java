package com.ggms.wholesale;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

public class NotificationActionReceiver extends BroadcastReceiver {
    private static final String TAG = "NotificationAction";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String orderId = intent.getStringExtra("order_id");
        String customerShopId = intent.getStringExtra("customer_shop_id");
        int notificationId = intent.getIntExtra("notification_id", 1001);

        Log.d(TAG, "onReceive: action=" + action + ", orderId=" + orderId);

        // Dismiss the notification
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        manager.cancel(notificationId);

        if (orderId == null || action == null) return;

        // Perform HTTP calls in background thread
        Executors.newSingleThreadExecutor().execute(() -> {
            updateOrderStatus(orderId, action);
            notifyCustomer(customerShopId, orderId, action);
        });
    }

    private void updateOrderStatus(String orderId, String action) {
        try {
            String status;
            if ("ACCEPT".equals(action)) {
                status = "processing";
            } else if ("PENDING".equals(action)) {
                status = "pending";
            } else {
                status = "cancelled";
            }

            URL url = new URL("https://krszcqbcanlmjviyszzi.supabase.co/rest/v1/orders?id=eq." + orderId);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("PATCH");
            conn.setRequestProperty("apikey", "sb_publishable_Y5f1L6LEIioOZ45a8dRzUw_yhyY2hFD");
            conn.setRequestProperty("Authorization", "Bearer sb_publishable_Y5f1L6LEIioOZ45a8dRzUw_yhyY2hFD");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            String jsonPayload = "{\"status\":\"" + status + "\"}";
            byte[] out = jsonPayload.getBytes(StandardCharsets.UTF_8);
            
            try (OutputStream os = conn.getOutputStream()) {
                os.write(out);
            }

            int responseCode = conn.getResponseCode();
            Log.d(TAG, "updateOrderStatus response: " + responseCode);
            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "updateOrderStatus error", e);
        }
    }

    private void notifyCustomer(String customerShopId, String orderId, String action) {
        if (customerShopId == null || customerShopId.isEmpty()) return;

        try {
            String message;
            if ("ACCEPT".equals(action)) {
                message = "✅ Accept - તમારો ઓર્ડર accept થઈ ગયો!";
            } else if ("PENDING".equals(action)) {
                message = "⏳ Pending - ઓર્ડર pending છે, રાહ જુઓ";
            } else {
                message = "❌ Decline - ઓર્ડર decline થયો";
            }

            URL url = new URL("https://ggms-wholesale-app.vercel.app/api/send-push");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            String jsonPayload = "{"
                    + "\"type\":\"system_alert\","
                    + "\"title\":\"GGM&S Wholesale - ઓર્ડર Update 📦\","
                    + "\"message\":\"" + message + "\","
                    + "\"target_type\":\"selected\","
                    + "\"selected_customer_ids\":[\"" + customerShopId + "\"],"
                    + "\"buttonLink\":\"/orders/" + orderId + "\""
                    + "}";

            byte[] out = jsonPayload.getBytes(StandardCharsets.UTF_8);
            
            try (OutputStream os = conn.getOutputStream()) {
                os.write(out);
            }

            int responseCode = conn.getResponseCode();
            Log.d(TAG, "notifyCustomer response: " + responseCode);
            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "notifyCustomer error", e);
        }
    }
}
