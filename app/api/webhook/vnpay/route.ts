import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import crypto from 'crypto';

export async function GET(request: Request) {
    // VNPAY often uses GET for redirect return (vnp_ReturnUrl), but IPN (vnp_IpnUrl) is usually GET too?
    // According to VNPAY docs, IPN is GET.
    
    const { searchParams } = new URL(request.url);
    const vnp_Params = Object.fromEntries(searchParams.entries());
    console.log("VNPAY IPN Params:", vnp_Params);

    // VNPAY IPN checks
    // vnp_SecureHash is the signature
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sort params to verify hash
    // const sortedParams = sortObject(vnp_Params); 
    // const secretKey = process.env.VNPAY_HASH_SECRET;
    // ... verify hash ...

    const rspCode = vnp_Params['vnp_ResponseCode'];
    
    if (rspCode === '00') { // 00: Payment Success
        const amount = parseInt(vnp_Params['vnp_Amount']) / 100; // VNPAY amount is *100
        const orderInfo = vnp_Params['vnp_OrderInfo']; // Content
        const txnRef = vnp_Params['vnp_TxnRef']; // Order ID
        const bankTranNo = vnp_Params['vnp_BankTranNo']; // Bank Transaction No

        const description = orderInfo || "";
        // Extract User ID
        const match = description.match(/GUMZ\s*[:]?\s*(\d+)/i);
        const userId = match ? match[1] : null;

        if (userId) {
             const { data: existing } = await supabase
                .from('transactions')
                .select('id')
                .eq('transaction_id', bankTranNo || txnRef)
                .single();
             
             if (!existing) {
                 await supabase.from('transactions').insert({
                     user_id: parseInt(userId),
                     amount: amount,
                     description: description,
                     status: 'success',
                     transaction_id: bankTranNo || txnRef,
                     rewarded: false
                 });
             }
        }
        
        return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    }

    return NextResponse.json({ RspCode: '97', Message: 'Invalid Checksum' }); // Or other error
}

// Support POST just in case, though VNPAY docs specified GET for IPN in older versions, some gateways use POST.
export async function POST(request: Request) {
    // ... similar logic if using POST ...
    return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
}
