const staticCacheName = 'hu.violapeter.memorygame'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(staticCacheName).then(function (cache) {
      return cache.addAll(['/'])
    })
  )
})

self.addEventListener("fetch", function (event) {
  console.log(event.request.url);

  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});
