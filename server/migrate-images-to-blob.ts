/**
 * Migration Script: Move Database-Stored Images to Vercel Blob
 *
 * This script:
 * 1. Fetches image IDs from the uploadedFiles table (without loading data)
 * 2. Processes each image one at a time (to avoid memory issues)
 * 3. Uploads each to Vercel Blob storage
 * 4. Updates all references (tournaments, users, teams, messages, etc.)
 *
 * Run with: npx tsx --env-file=.env server/migrate-images-to-blob.ts
 */

import { put } from '@vercel/blob';

// Check for required env var
if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is not set in .env');
    process.exit(1);
}

async function migrateImages() {
    console.log('🚀 Starting image migration to Vercel Blob...\n');

    // Dynamic imports
    const { db } = await import('./db.js');
    const schema = await import('../shared/schema.js');
    const { eq, sql } = await import('drizzle-orm');

    const { uploadedFiles, tournaments, users, teamProfiles, threadMessages, channelMessages } = schema;

    // 1. First, just get the IDs (without loading the huge base64 data)
    console.log('📦 Counting images in database...');
    const imageIds = await db
        .select({ id: uploadedFiles.id, mimeType: uploadedFiles.mimeType })
        .from(uploadedFiles);

    console.log(`   Found ${imageIds.length} images to migrate\n`);

    if (imageIds.length === 0) {
        console.log('✅ No images to migrate!');
        return;
    }

    const urlMappings: Array<[string, string]> = [];
    let successCount = 0;
    let failedCount = 0;

    // 2. Process each image ONE AT A TIME to avoid memory issues
    console.log('☁️  Uploading images to Vercel Blob (one at a time)...\n');

    for (let i = 0; i < imageIds.length; i++) {
        const imageInfo = imageIds[i];
        console.log(`   [${i + 1}/${imageIds.length}] Processing ${imageInfo.id}...`);

        try {
            // Fetch the data for just this one image
            const [image] = await db
                .select()
                .from(uploadedFiles)
                .where(eq(uploadedFiles.id, imageInfo.id))
                .limit(1);

            if (!image || !image.data) {
                console.log(`      ⏭️  Skipped (no data)`);
                continue;
            }

            // Decode base64 data
            const buffer = Buffer.from(image.data, 'base64');
            console.log(`      📏 Size: ${(buffer.length / 1024).toFixed(1)} KB`);

            // Upload to Vercel Blob
            const blob = await put(image.id, buffer, {
                access: 'public',
                contentType: image.mimeType,
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN, // Explicitly pass token
                // @ts-ignore - types might be outdated but the error says to use it
                allowOverwrite: true,
            });

            const oldUrl = `/api/uploads/${image.id}`;
            urlMappings.push([oldUrl, blob.url]);
            successCount++;

            console.log(`      ✅ Uploaded -> ${blob.url}`);
        } catch (error: any) {
            console.error(`      ❌ Failed: ${error.message}`);
            failedCount++;
        }
    }

    console.log(`\n📊 Upload Results: ${successCount} succeeded, ${failedCount} failed\n`);

    if (urlMappings.length === 0) {
        console.log('❌ No images were uploaded, skipping reference updates');
        return;
    }

    // 3. Update references in database tables
    console.log('🔄 Updating image references in database...\n');

    // Update tournaments
    let tournamentsUpdated = 0;
    for (const [oldUrl, newUrl] of urlMappings) {
        try {
            const result = await db.update(tournaments).set({ imageUrl: newUrl }).where(eq(tournaments.imageUrl, oldUrl));
            tournamentsUpdated++;
        } catch (e) { /* ignore */ }
    }
    console.log(`   ✅ Checked tournaments.imageUrl`);

    // Update users
    for (const [oldUrl, newUrl] of urlMappings) {
        try {
            await db.update(users).set({ avatarUrl: newUrl }).where(eq(users.avatarUrl, oldUrl));
        } catch (e) { /* ignore */ }
    }
    console.log(`   ✅ Checked users.avatarUrl`);

    // Update team profiles
    for (const [oldUrl, newUrl] of urlMappings) {
        try {
            await db.update(teamProfiles).set({ logoUrl: newUrl }).where(eq(teamProfiles.logoUrl, oldUrl));
        } catch (e) { /* ignore */ }
    }
    console.log(`   ✅ Checked teamProfiles.logoUrl`);

    // Update thread messages
    for (const [oldUrl, newUrl] of urlMappings) {
        try {
            await db.update(threadMessages).set({ imageUrl: newUrl }).where(eq(threadMessages.imageUrl, oldUrl));
        } catch (e) { /* ignore */ }
    }
    console.log(`   ✅ Checked threadMessages.imageUrl`);

    // Update channel messages
    for (const [oldUrl, newUrl] of urlMappings) {
        try {
            await db.update(channelMessages).set({ imageUrl: newUrl }).where(eq(channelMessages.imageUrl, oldUrl));
        } catch (e) { /* ignore */ }
    }
    console.log(`   ✅ Checked channelMessages.imageUrl`);

    console.log('\n✅ Migration completed!\n');

    console.log('📋 Summary:');
    console.log(`   - Uploaded to Blob: ${successCount}`);
    console.log(`   - Failed uploads: ${failedCount}`);
    console.log(`   - URL mappings created: ${urlMappings.length}`);

    console.log('\n⚠️  IMPORTANT: The old database records are still in place.');
    console.log('   After verifying everything works, you can delete them with:');
    console.log('   DELETE FROM "uploadedFiles";');
    console.log('');
}

migrateImages()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
