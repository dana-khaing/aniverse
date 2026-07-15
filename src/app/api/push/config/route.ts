export function GET(){const publicKey=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;if(!publicKey)return Response.json({configured:false},{status:503});return Response.json({configured:true,publicKey})}
