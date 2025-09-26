import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("Webhook recebido:", JSON.stringify(body, null, 2));
    
    // O MercadoPago envia diferentes tipos de notificações
    if (body.type === "payment") {
      const paymentId = body.data.id;
      
      // Confirmar o pagamento usando a API do MercadoPago
      const payment = new Payment(client);
      
      try {
        const paymentData = await payment.get({
          id: paymentId,
        });
        
        
        // Verificar status do pagamento
        if (paymentData.status === 'approved') {
          console.log(`✅ Pagamento ${paymentId} APROVADO`);
          console.log("Detalhes:", {
            id: paymentData.id,
            status: paymentData.status,
            amount: paymentData.transaction_amount,
            email: paymentData.payer?.email,
            external_reference: paymentData.external_reference,
            date_approved: paymentData.date_approved,
          });
          
          // Aqui você pode:
          // 1. Salvar no banco de dados
          // 2. Enviar email de confirmação
          // 3. Atualizar status da inscrição
          // 4. Integrar com Google Sheets
          
        } else if (paymentData.status === 'rejected') {
          console.log(`❌ Pagamento ${paymentId} REJEITADO`);
        } else if (paymentData.status === 'pending') {
          console.log(`⏳ Pagamento ${paymentId} PENDENTE`);
        }
        
      } catch (paymentError) {
        console.error("Erro ao buscar dados do pagamento:", paymentError);
      }
    }
    
    // Sempre retorne 200 para confirmar recebimento
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}