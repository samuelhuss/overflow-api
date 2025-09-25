import { NextRequest, NextResponse } from "next/server";

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
      
      // Aqui você pode:
      // 1. Buscar detalhes do pagamento na API do MercadoPago
      // 2. Salvar no banco de dados
      // 3. Enviar email de confirmação
      // 4. Atualizar status da inscrição
      
      console.log(`Pagamento ${paymentId} processado`);
      
      // Por enquanto, só loggar os dados
      console.log("Dados do pagamento:", {
        id: paymentId,
        status: body.action,
        timestamp: new Date().toISOString()
      });
    }
    
    // Sempre retorne 200 para confirmar recebimento
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}