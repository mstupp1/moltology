# Social publishing media storage

Social production keeps its archive in Neon S3 and publishes from Zernio-hosted media.
The post, carousel, reel/short, and series CLIs pass local production files to
`scripts/lib/zernio-client.ts`. The shared client obtains a presigned upload URL,
uploads each file to Zernio without forwarding the API authorization header to
storage, and creates the post only after all media uploads succeed.

URL-only inputs are copied to Zernio once before post creation. Recognized Neon
bucket URLs are read through the site's absolute `/media` URL. Existing
`https://media.zernio.com` inputs can be reused directly. Local production files
are preferred so publishing does not read the archive back from Neon.

Carousel order is preserved. A unified Instagram Reel/YouTube Short uploads its
video once. Dry runs make no media or publishing requests. Upload failures stop
publication rather than falling back to a Neon URL. The original post payload
determines the creation idempotency key so a retry with a fresh Zernio upload URL
does not become a different logical post within Zernio's 24-hour retry window.

Zernio's temporary uploads expire after seven days; attaching them to a created
or updated post promotes the media to permanent storage. Upload immediately
before creating/updating the post. Do not store unattached temporary URLs for
later production runs.

## Existing posts

Changing the publishing code does not change saved Zernio posts. Draft and
scheduled records can have their media replaced with Zernio uploads while keeping
their captions, platform configuration, and schedules. Published records cannot
have their media replaced or be deleted through the normal post API. Ask Zernio
support about migrating or removing historical dashboard references while
preserving live platform posts.

Do not clear the whole queue to reduce preview traffic. The `unpublish` endpoint
removes live platform content, including permanently deleting YouTube videos;
it is not a dashboard-only cleanup operation. Until historical references are
resolved, use a scheduled-post filter instead of the entire historical gallery.

Sources:

- [Media uploads and retention](https://docs.zernio.com/guides/media-uploads)
- [Create-post retries](https://docs.zernio.com/posts/list-posts)
- [Update post](https://docs.zernio.com/posts/update-post)
- [Delete post](https://docs.zernio.com/posts/delete-post)
- [Unpublish post](https://docs.zernio.com/posts/unpublish-post)
