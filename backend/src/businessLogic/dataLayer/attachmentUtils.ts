import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import 'source-map-support/register'

const XAWS = AWSXRay.captureAWS(AWS)

/**
 * File storage logic
 */
export class AttachmentUtils {

    constructor(
        private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
    ) { }

    getAttachmentUrl(attachmentId: string): string {
        return `https://${this.bucketName}.s3.amazonaws.com/${attachmentId}`
    }

    getUploadUrl(attachmentId: string): string {
        const uploadUrl = this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: attachmentId,
            Expires: parseInt(this.urlExpiration)
        })

        return uploadUrl
    }

}
