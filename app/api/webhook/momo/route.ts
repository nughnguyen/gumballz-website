import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Momo Webhook payload:", body);

        // Momo IPN structure usually includes:
        // partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultArray, signature
        
        const { partnerCode, orderId, requestId, amount, orderInfo, transId, resultCode, signature } = body;

        // Verify Signature (If secret is provided)
        // const secretKey = process.env.MOMO_SECRET_KEY;
        // if (secretKey) {
        //      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        //      const computedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
        //      if (computedSignature !== signature) return NextResponse.json({ message: 'Invalid Signature' }, { status: 400 });
        // }

        if (resultCode == 0) { // 0 means success in Momo
             // Extract User ID from orderInfo ("GUMZ 123")
             const description = orderInfo || "";
             const match = description.match(/GUMZ\s*[:]?\s*(\d+)/i);
             const userId = match ? match[1] : null;

             if (userId) {
                 const { data: existing } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('transaction_id', transId.toString())
                    .single();
                 
                 if (!existing) {
                     await supabase.from('transactions').insert({
                         user_id: parseInt(userId),
                         amount: amount,
                         description: description,
                         status: 'success',
                         transaction_id: transId.toString(),
                         rewarded: false
                     });
                 }
             }
        }

        return NextResponse.json({ message: 'Success' }, { status: 204 }); // Momo expects 204 or 200
    } catch (e) {
        console.error("Momo Webhook Error:", e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
