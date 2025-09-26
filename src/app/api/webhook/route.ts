import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

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
          
          // Salvar pagamento aprovado diretamente
          try {
            const dadosParaSalvar = {
              payment_id: paymentData.id,
              email: paymentData.payer?.email,
              amount: paymentData.transaction_amount,
              status: paymentData.status,
              date_approved: paymentData.date_approved,
              payment_type: paymentData.payment_type_id,
              installments: paymentData.installments,
              created_at: new Date().toISOString(),
            };
            
            console.log("Dados do pagamento para salvar:", dadosParaSalvar);
            
            // Integração com Google Sheets
            const serviceAccountAuth = new JWT({
              email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
              key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
              scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
            await doc.loadInfo();
            
            // Buscar ou criar aba "Pagamentos"
            let sheetPagamentos = doc.sheetsByTitle["Pagamentos"];
            
            if (!sheetPagamentos) {
              // Criar nova aba se não existir
              sheetPagamentos = await doc.addSheet({ 
                title: "Pagamentos",
                headerValues: [
                  "Payment ID", 
                  "Email", 
                  "Valor", 
                  "Status", 
                  "Data Aprovação", 
                  "Referência Externa", 
                  "Tipo Pagamento", 
                  "Parcelas", 
                  "Data Criação"
                ]
              });
            }
            
            // Adicionar linha com dados do pagamento
            await sheetPagamentos.addRow({
              "Payment ID": dadosParaSalvar.payment_id,
              "Email": dadosParaSalvar.email,
              "Valor": `R$ ${dadosParaSalvar.amount}`,
              "Status": dadosParaSalvar.status,
              "Data Aprovação": dadosParaSalvar.date_approved,
              "Referência Externa": dadosParaSalvar.external_reference,
              "Tipo Pagamento": dadosParaSalvar.payment_type,
              "Parcelas": dadosParaSalvar.installments,
              "Data Criação": dadosParaSalvar.created_at,
            });
            
            console.log(`✅ Pagamento ${paymentData.id} salvo na planilha com sucesso!`);
            
          } catch (saveError) {
            console.error("Erro ao salvar pagamento na planilha:", saveError);
          }
          
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