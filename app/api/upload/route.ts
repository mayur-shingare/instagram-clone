import { AWS_BUCKET_NAME, AWS_KEY, AWS_REGION, AWS_SECRET } from '@/app/constants/constants';
import S3 from 'aws-sdk/clients/s3'
import { NextResponse } from 'next/server';

export async function POST(req: any) {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const s3 = new S3({
        signatureVersion: 'v4',
        region: AWS_REGION,
        accessKeyId: AWS_KEY,
        secretAccessKey: AWS_SECRET,
    })
    const preSignedUrl = await s3.getSignedUrl("putObject", {
        Bucket: AWS_BUCKET_NAME,
        Key: `${body.userId}/${body.file}`,
        ContentType: body.fileType,
        Expires: 5 * 60
    })

    return NextResponse.json({ url: preSignedUrl }, { status: 200 })
}
