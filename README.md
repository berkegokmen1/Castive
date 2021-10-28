## **Castive**

### A platform to build and share movie & tv series playlists

---

[**Table Of Contents**](#castive)

- [**1. What is Castive?**](#1-what-is-castive)
- [**2. Using 2 Databases - Redis & MongoDB**](#2-using-2-databases---redis--mongodb)
- [**3. Improved authentication system using 2 tokens and redis**](#3-improved-authentication-system-using-2-tokens-and-redis)
- [**4. Ratelimiting feature**](#4-ratelimiting-feature)
- [**5. Password reset and mail confirmation system**](#5-password-reset-and-mail-confirmation-system)
- [**6. Improving response times and reducing the load on MongoDB**](#6-improving-response-times-and-reducing-the-load-on-mongodb)
- [**7. Partial and full-text search system**](#7-partial-and-full-text-search-system)
- [**8. Protection for XSS & NoSQL Injection and Parameter pollution attacks**](#8-protection-for-xss--nosql-injection-and-parameter-pollution-attacks)
- [**9. Highly Customizable responses using many available query parameters**](#9-highly-customizable-responses-using-query-parameters)
- [**10. Technologies used to build Castive**](#10-technologies-used-to-build-castive)
- [LICENSE](#license)

### **1. What is Castive?**

Castive is a platform where people can create accounts, build and share playlists with their favourite movies and tv series. People can follow each other, like other people's playlists or block other users so that their playlists are not visible to those users.

> This project is the backend service for Castive.

---

### **2. Using 2 Databases - Redis & MongoDB**

_MongoDB_ was chosen over traditional SQL databases since it provides a handful of tools like full text search and documents structures are easily changed unlike a SQL database.<br>_Redis_ is used alongside MongoDB to store jwt tokens of all kinds to improve response times and seperate the application logic from token system.<br>

- **Caching**<br>
  Redis is also used for caching responses from _[TMDB](https://www.themoviedb.org)_ and _Announcements_ that are stored in the main (MongoDB) database. This allows for faster generated responses and reduces the number of requests sent to _TMDB_.

---

### **3. Improved authentication system using 2 tokens and redis**

Most applications use only _access token_ and some of those have the _[silent authentication system](https://docs.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/auth-silent-aad)_. However this system is not easy to implement and fairly complicated compared to refresh tokens. That's why I decided to go with access and _[refresh token](https://www.loginradius.com/blog/start-with-identity/refresh-tokens-jwt-interaction/)_ system.<br><br>
The improvement over other systems is that both tokens get stored in _Redis_ database rather than main database. This allows the server to respond quicker to subsequent requests made with access tokens and refresh tokens since every request requires a validation of the tokens.<br><br>
Implementation of this system can be seen in `src/util/jwt.js` and `src/controllers/v1/auth.controllers.js`.

---

### **4. Ratelimiting feature**

Castive is using rate limiting in most routes to prevent brute force attacks and abuse. Implementation of rate limiting can be found in `src/util/limiter.js`.

---

### **5. Password reset and mail confirmation system**

Just like every single social platform, Castive has its own mailing system to send password reset tokens and mail confirmations. Implementation can be found in `src/util/mailer.js` \* Tokens sent with all mails are also stored in _Redis_ to validate afterwards and improve security.

---

### **6. Improving response times and reducing the load on MongoDB**

- **Image System**<br>
  For the image system, I've used a seperate Image model. The system works in the following order: <br>

  1. User uploads an image
  2. The image is then stored in a `Image` document with `original` property set
  3. When the image's `small` or `medium` format is requested, they are generated on the fly for just one time.
  4. For every other subsequent request the requested type is sent with response

  <br>That is, if `small` and `medium` are not requested, those fields will remain `null`, therby not becoming a burden on database. Moreover, having the `small` and `medium` version of the images opens the possiblity of requesting those versions whenever `original` is simply not needed, thereby improving response times.

- **Virtual Fields in Models**<br>
  There are simply no fields to store some of the properties of users and lists. For instance, under a `user` document, only `following` property is stored. Whenever `followers` property is needed for a response, it gets generated using _Mongoose_'s very handful `.populate()` method. The implementation of populating field can be seen in both `src/models/user.model.js` and `src/models/list.model.js`.

---

### **7. Partial and full-text search system**

Thanks to _MongoDB_, it was easy to implement a full-text search without dealing with systems like _[Elastic Search](https://www.elastic.co)_. Implementing full text search is as simple as follows,

```js
.find(
      {
        $text: {
          $search: q,
          $caseSensitive: false,
          $diacriticSensitive: false,
        },
        _id: { $ne: id },
        blocked: { $nin: [id] },
      },
      { score: { $meta: 'textScore' } }
    )
```

For the partial text search part, I use _Regular Expressions_ whenever the result from full text search yields 0 results.<br>
The full implementation can be seen in `src/models/user.model.js`.

---

### **8. Protection for XSS & NoSQL Injection and Parameter pollution attacks**

Security is important, especially if you are building a social platform. To overcome some common problems, I took help from some packages such as, [Helmet](https://www.npmjs.com/package/helmet), [MongoSanitize](https://www.npmjs.com/package/express-mongo-sanitize) and [HPP](https://www.npmjs.com/package/hpp).

---

### **9. Highly Customizable responses using query parameters**

Almost all of the endpoints take a great amount of query parameters to customize the response according to the needs. This allows the requester to exclude any information that is not needed and improve response times. An example can be seen below.

`/users/me?following=1&followers=0&lists=true&blocked=false&library=1`

---

### **10. Technologies used to build Castive**

Castive uses a number of technologies to operate.

- [Express] - Fast node.js network app framework
- [node.js] - Evented I/O for the backend
- [JWT] - Industry standard RFC 7519 method for representing claims securely between two parties
- [MongoDB] - A document database
- [Redis] - In-memory data structure store
- [Mongoose] - Elegant mongodb object modeling for NodeJS
- [TMDB] - The Movie Database (TMDB) is a community built movie and TV database.
  <br><br>

\* This product uses the TMDB API but is not endorsed or certified by TMDB.

---

## LICENSE

This project is under [GNU GPLv3](https://www.gnu.org) license. See [LICENSE](./LICENSE.txt) and [COPYING](./COPYING.txt) for more.

---

## Contact

For anything related to the project, contact me at [ahmetberkegokmen@gmail.com](mailto:ahmetberkegokmen@gmail.com).

---

## Attributions

<br>

![TMDB](https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg)

[node.js]: http://nodejs.org
[express]: http://expressjs.com
[jwt]: https://jwt.io
[mongodb]: https://www.mongodb.com
[redis]: https://redis.io
[mongoose]: https://mongoosejs.com
[tmdb]: https://www.themoviedb.org
