# Livemart Checkout

A standalone js library to add livemart checkout to any website.

#### Dependencies

- Sweet Alert `<script src="https://unpkg.com/sweetalert/dist/sweetalert.min.js"></script>`
- Stripe `<script src="https://js.stripe.com/v3/"></script>`

### API functions

* Add item to cart

```js
add_to_cart(productId);
```

* Show cart

```js
show_cart();
```

* Set store key

```js
set_store_key(key);
```

* Set store secret

```js
set_store_secret(secret);
```

* Get store info

```js
get_store_info()
```

### Example

1. Step 1

```text
Set store key & secret. And get store info
```

2. Step 2

```text
Add items to cart
```

3. Step 3

```text
Show cart
```

Check `index.html` for details.

### UI

- Cart
  ![Cart](./resources/screen_2.png)

- Checkout
  ![Checkout](./resources/screen_1.png)

Copyright © 2021 [LiveMart](https://livemart.xyz)
