import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

// Adicionar função para lidar com OPTIONS (preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST() {
  try {
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Inscrição",
            quantity: 1,
            unit_price: 1,
            id: "acampamento",
          },
        ],
        back_urls: {
          success: "https://d1ministry.framer.website/eventos/overflow",
          failure: "https://d1ministry.framer.website/eventos/overflow",
          pending: "https://d1ministry.framer.website/eventos/overflow",
        },
        auto_return: "approved",
        notification_url: "https://overflow-api.vercel.app/api/webhook",
      },
    });

    // Adicionar headers CORS na resposta
    return NextResponse.json(
      { init_point: result.init_point },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    return NextResponse.json(
      { error: "Erro ao criar preferência" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
