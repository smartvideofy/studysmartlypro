import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
}

interface PushSubscription {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_id: string;
}

async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPrivateKey: string,
  vapidPublicKey: string
): Promise<Response> {
  const encoder = new TextEncoder();
  
  // Import VAPID keys
  const privateKeyData = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const publicKeyData = Uint8Array.from(atob(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  // Generate VAPID JWT
  const header = { alg: "ES256", typ: "JWT" };
  const audience = new URL(subscription.endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: "mailto:notifications@studily.app"
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimsB64 = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Sign the token
  const privateKey = await crypto.subtle.importKey(
    "raw",
    privateKeyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const jwt = `${unsignedToken}.${signatureB64}`;

  // Encrypt the payload
  const p256dhKey = Uint8Array.from(atob(subscription.p256dh_key.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const authSecret = Uint8Array.from(atob(subscription.auth_key.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

  // Generate local key pair for ECDH
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKey = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKeyBytes = new Uint8Array(localPublicKey);

  // Import subscriber's public key
  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    p256dhKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberKey },
    localKeyPair.privateKey,
    256
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive encryption key using HKDF
  const sharedSecretKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(sharedSecret),
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  // Create info for HKDF
  const authInfo = encoder.encode("Content-Encoding: auth\0");
  const keyInfo = new Uint8Array([
    ...encoder.encode("Content-Encoding: aes128gcm\0"),
    ...encoder.encode("P-256\0"),
    0, 65, ...p256dhKey,
    0, 65, ...localPublicKeyBytes
  ]);

  // PRK from auth secret
  const authSecretKey = await crypto.subtle.importKey(
    "raw",
    authSecret,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  const ikm = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authSecret, info: authInfo },
    sharedSecretKey,
    256
  );

  const ikmKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(ikm),
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  const contentEncryptionKey = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: keyInfo },
    ikmKey,
    128
  );

  const nonceInfo = new Uint8Array([
    ...encoder.encode("Content-Encoding: nonce\0"),
    ...encoder.encode("P-256\0"),
    0, 65, ...p256dhKey,
    0, 65, ...localPublicKeyBytes
  ]);

  const nonce = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
    ikmKey,
    96
  );

  // Encrypt the payload
  const encryptionKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(contentEncryptionKey),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const paddedPayload = new Uint8Array([...encoder.encode(payload), 2]);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(nonce) },
    encryptionKey,
    paddedPayload
  );

  // Build the encrypted body
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);

  const body = new Uint8Array([
    ...salt,
    ...recordSize,
    1, // idlen
    ...localPublicKeyBytes,
    ...new Uint8Array(encrypted)
  ]);

  // Send the push notification
  return fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
      "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
      "Urgency": "normal"
    },
    body
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!vapidPrivateKey || !vapidPublicKey) {
      throw new Error("VAPID keys not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, userIds, title, body, icon, badge, data, tag }: PushNotificationRequest = await req.json();

    const targetUserIds = userIds || (userId ? [userId] : []);

    if (targetUserIds.length === 0) {
      throw new Error("No user IDs provided");
    }

    // Fetch push subscriptions for target users
    const { data: subscriptions, error } = await supabaseClient
      .from("push_subscriptions")
      .select("*")
      .in("user_id", targetUserIds);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No push subscriptions found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/pwa-192x192.png",
      badge: badge || "/pwa-192x192.png",
      data: data || {},
      tag: tag || "studily-notification"
    });

    // Send notifications in parallel
    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        sendWebPush(sub as PushSubscription, payload, vapidPrivateKey, vapidPublicKey)
      )
    );

    const successful = results.filter(r => r.status === "fulfilled" && (r.value as Response).ok).length;
    const failed = results.length - successful;

    // Clean up invalid subscriptions
    const failedSubscriptions = results
      .map((r, i) => ({ result: r, subscription: subscriptions[i] }))
      .filter(({ result }) => {
        if (result.status === "rejected") return true;
        const response = (result as PromiseFulfilledResult<Response>).value;
        return response.status === 404 || response.status === 410;
      });

    if (failedSubscriptions.length > 0) {
      await supabaseClient
        .from("push_subscriptions")
        .delete()
        .in("id", failedSubscriptions.map(f => f.subscription.id));
    }

    console.log(`Push notifications sent: ${successful} success, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: successful, failed }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending push notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
