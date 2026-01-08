
const ONESIGNAL_APP_ID = "16b342fd-84ce-4ac8-957e-4ba996aaedde";
const ONESIGNAL_API_KEY = "os_v2_app_c2zuf7mezzfmrfl6jouznkxn3ztnsljdjbguuwmjljk43vdnckiw3xhuxycsdxym3zqpdpup7t4wpc7etnkwefahuarxpe7xepyvwmq";

interface NotificationResult {
    success: boolean;
    id?: string;
    error?: string;
}

/**
 * Sends a push notification to specific users via OneSignal REST API
 * @param userIds List of user IDs (Supabase IDs / External IDs)
 * @param title Notification Title
 * @param message Notification Body
 * @param data Optional additional data object
 */
export async function sendNotification(
    userIds: string[],
    title: string,
    message: string,
    data: object = {}
): Promise<NotificationResult> {
    if (!userIds || userIds.length === 0) {
        return { success: false, error: 'No user IDs provided' };
    }

    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${ONESIGNAL_API_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_external_user_ids: userIds,
                headings: { en: title, pt: title }, // Default to same title, language support can be added
                contents: { en: message, pt: message },
                data: data,
                // Optional: Add specific Android/iOS settings here if needed
                small_icon: "ic_stat_onesignal_default",
                android_accent_color: "FFD32F2F" // Primary color roughly
            })
        });

        const json = await response.json();

        if (json.id) {
            return { success: true, id: json.id };
        } else {
            return { success: false, error: JSON.stringify(json.errors) };
        }

    } catch (error) {
        console.error("Error sending notification:", error);
        return { success: false, error: String(error) };
    }
}
