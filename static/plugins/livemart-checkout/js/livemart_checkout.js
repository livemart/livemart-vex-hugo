function set_store_key(key) {
    localStorage.setItem('livemart_store_key', key);
}

function get_store_key() {
    return localStorage.getItem('livemart_store_key');
}

function get_store_info() {
    let storeInfoPayload = {
        'query': `query { storeBySecret { name title description currency isOpen } }`
    };
    sendRequest(storeInfoPayload, function (result) {
        if (result.data !== null) {
            localStorage.setItem('store_info', JSON.stringify(result.data.storeBySecret));
            return
        }
        alert('Failed to get store info');
    }, function (err) {
        alert('Failed to send request');
    });
}

function set_store_secret(secret) {
    localStorage.setItem('livemart_store_secret', secret);
}

function get_store_secret() {
    return localStorage.getItem('livemart_store_secret');
}

function set_customer_access_token(token) {
    if (token === null) {
        localStorage.removeItem('livemart_customer_access_token');
        return
    }
    localStorage.setItem('livemart_customer_access_token', token);
}

function get_customer_access_token() {
    return localStorage.getItem('livemart_customer_access_token');
}

function set_cart_id(id) {
    if (id === null) {
        localStorage.removeItem('livemart_cart_id');
        return
    }
    localStorage.setItem('livemart_cart_id', id);
}

function get_cart_id() {
    return localStorage.getItem('livemart_cart_id');
}

function get_product_details(id, successCallback, failureCallback) {
    let payload = {
        query: `query { product(productId: "${id}") { id name images attributes { id name values isRequired } } }`
    }
    sendRequest(payload, successCallback, failureCallback);
}

function add_to_cart(itemId) {
    get_product_details(itemId, function (result) {
        if (result.data === null) {
            alert('Failed to get product details');
            return
        }
        set_product_info(result.data.product.id, result.data.product);

        let productName = result.data.product.name;
        let attributes = result.data.product.attributes;
        let attributeList = [];
        if (attributes.length > 0) {
            let mainDiv = document.createElement('div');
            let selectDiv = document.createElement('div');

            attributes.forEach(a => {
                let itemSelect = document.createElement('select');
                itemSelect.classList.add('form-control', 'mt-1', 'm-1');
                itemSelect.style = `width: 120px;display: inline`;
                itemSelect.onchange = function (e) {
                    on_product_attribute_selected(itemId, a.id, e.target.value);
                }

                attributeList.push({
                    id: a.id,
                    name: a.name,
                    is_required: a.isRequired,
                });

                let itemSelectOption = document.createElement('option');
                itemSelectOption.value = a.name;
                itemSelectOption.innerText = a.name;
                itemSelectOption.disabled = true;
                itemSelectOption.selected = true;
                itemSelect.appendChild(itemSelectOption);

                a.values.forEach(v => {
                    let itemSelectOption = document.createElement('option');
                    itemSelectOption.value = v;
                    itemSelectOption.innerText = v;
                    itemSelectOption.selected = get_required_attribute_value(itemId, a.id) === v;
                    itemSelect.appendChild(itemSelectOption);
                })
                selectDiv.appendChild(itemSelect);
            });
            mainDiv.appendChild(selectDiv);

            let addToCartWithAttribute = document.createElement('button');
            addToCartWithAttribute.classList.add('btn', 'btn-primary', 'mt-2');
            addToCartWithAttribute.innerText = 'Add To Cart';
            addToCartWithAttribute.onclick = function () {
                if (check_if_required_attributes_selected(itemId)) {
                    update_or_initiate_cart(itemId);
                }
            }
            mainDiv.appendChild(addToCartWithAttribute);

            set_required_attributes(itemId, attributeList);

            swal({
                text: `Choose Attributes for ${productName}`,
                content: mainDiv,
                button: false,
            })
        } else {
            update_or_initiate_cart(itemId);
        }
    }, function (err) {
        alert('Failed to send request');
    });
}

function update_or_initiate_cart(itemId) {
    if (get_cart_id() === null) {
        let attributeQuery = ``;
        let attributes = get_required_attributes(itemId);
        attributes.forEach(a => {
            let id = a.id;
            let selectedValue = get_required_attribute_value(itemId, id);
            if (selectedValue !== null) {
                attributeQuery += `{ Id: "${id}" attributeSelectedValue: "${selectedValue}" }`;
            }
        });

        let payload = {
            'query': `mutation { newCart(params: { cartItems: { productId: "${itemId}" quantity: 1 productAttributes: [ ${attributeQuery} ] } }) { id isShippingRequired } }`
        }
        sendRequest(payload,
            function (result) {
                if (result.data !== null) {
                    set_cart_id(result.data.newCart.id);
                    show_cart();
                    return
                }
                alert(`${result.errors[0].message}`);
            },
            function (err) {
                alert('Failed to send request');
            });
    } else {
        let attributeQuery = ``;
        let attributes = get_required_attributes(itemId);
        attributes.forEach(a => {
            let id = a.id;
            let selectedValue = get_required_attribute_value(itemId, a.id);
            if (selectedValue !== null) {
                attributeQuery += `{ Id: "${id}" attributeSelectedValue: "${selectedValue}" }`;
            }
        });

        let payload = {
            'query': `mutation { updateCart(id: "${get_cart_id()}" params: { cartItems: { productId: "${itemId}" quantity: 1 productAttributes: [ ${attributeQuery} ] } }) { id isShippingRequired } }`
        }
        sendRequest(payload,
            function (result) {
                if (result.data !== null) {
                    show_cart();
                    return
                }
                alert(`${result.errors[0].message}`);
            },
            function (err) {
                alert('Failed to send request');
            });
    }
}

function set_product_info(id, v) {
    localStorage.setItem(id, JSON.stringify(v));
}

function get_product_info(id) {
    let prod = localStorage.getItem(id);
    if (prod === null) {
        return null;
    }
    return JSON.parse(prod);
}

function set_cart_item_ids(items) {
    localStorage.setItem('livemart_cart_item_ids', JSON.stringify(items));
}

function get_cart_item_ids() {
    return JSON.parse(localStorage.getItem('livemart_cart_item_ids'));
}

function append_recently_removed_id(id) {
    let key = 'recently_removed_item_ids';
    let v = localStorage.getItem(key);
    let items = [];
    if (v !== null) {
        items = JSON.parse(v);
    }
    items.push(id);
    localStorage.setItem(key, JSON.stringify(items));
}

function remove_recently_removed_id(id) {
    let key = 'recently_removed_item_ids';
    let v = localStorage.getItem(key);
    let items = [];
    if (v !== null) {
        items = JSON.parse(v);
        items = items.filter(v => v !== id);
    }
    localStorage.setItem(key, JSON.stringify(items));
}

function is_recently_removed_item(id) {
    let key = 'recently_removed_item_ids';
    let v = localStorage.getItem(key);
    let items = [];
    if (v !== null) {
        items = JSON.parse(v);
        let index = items.findIndex(value => value === id);
        return index !== -1;
    }
    return false
}

function set_required_attributes(key, attributes) {
    localStorage.setItem(`attributes_${key}`, JSON.stringify(attributes));
}

function get_required_attributes(key) {
    if (localStorage.getItem(`attributes_${key}`) == null) {
        return [];
    }
    return JSON.parse(localStorage.getItem(`attributes_${key}`));
}

function set_required_attribute_value(key, attribute, value) {
    localStorage.setItem(`attributes_${key}_${attribute}`, value);
}

function get_required_attribute_value(key, attribute) {
    return localStorage.getItem(`attributes_${key}_${attribute}`);
}

function check_if_required_attributes_selected(id) {
    let required_attributes = get_required_attributes(id);
    for (let i = 0; i < required_attributes.length; i++) {
        let a = required_attributes[i];
        let selected_value = get_required_attribute_value(id, a.id);
        if (selected_value === null && a.is_required) {
            alert(`Select ${a.name} of ${get_product_info(id).name}`);
            return false;
        }
    }
    return true;
}

function update_cart(successCallback, failureCallback) {
    let ids = get_cart_item_ids();
    if (ids === null) {
        return
    }

    let params = ``;
    ids.forEach(id => {
        let quantityParam = document.getElementById(`quantity_${id}`).innerText;
        quantityParam = quantityParam.trim();
        let quantity = Number(quantityParam);

        if (is_recently_removed_item(id)) {
            params += `{ productId: "${id}" quantity: 0 }`;
        } else {
            let attributeQuery = ``;
            let attributes = get_required_attributes(id);
            attributes.forEach(a => {
                let selectedValue = get_required_attribute_value(id, a.id);
                if (selectedValue !== null) {
                    attributeQuery += `{ Id: "${a.id}" attributeSelectedValue: "${selectedValue}" }`;
                }
            })

            params += `{ productId: "${id}" quantity: ${quantity} productAttributes: [ ${attributeQuery} ] }`;
        }
    })

    let payload = {
        'query': `mutation { updateCart(id: "${get_cart_id()}" params: { cartItems: [${params}] }) { id isShippingRequired } }`
    }
    sendRequest(payload, successCallback, failureCallback);
}

function show_cart() {
    if (get_cart_id() === null) {
        let payload = {
            'query': `mutation { newCart(params: { cartItems: [] }) { id isShippingRequired } }`
        }
        sendRequest(payload,
            function (result) {
                if (result.data !== null) {
                    set_cart_id(result.data.newCart.id);
                    show_cart();
                    return
                }
                alert('Failed show cart');
            },
            function (err) {
                alert('Failed to send request');
            });
        return
    }

    let payload = {
        'query': `query { cart(cartId: "${get_cart_id()}") { id isShippingRequired cartItems { id purchasePrice quantity product { id name slug description sku stock price isDigitalProduct productSpecificDiscount images attributes { id name values isRequired } } } } }`
    };
    sendRequest(payload, function (result) {
        if (result.data !== null) {
            set_is_shipping_required(result.data.isShippingRequired);

            let cartItems = result.data.cart.cartItems;
            let list = document.createElement('table');
            list.classList.add('table');

            let listHead = document.createElement('thead');
            let listHeadItem = document.createElement('tr');

            let listHeadItemName = document.createElement('td');
            listHeadItemName.innerHTML = 'Product Name';
            listHeadItem.appendChild(listHeadItemName);
            //
            let listHeadItemPrice = document.createElement('td');
            listHeadItemPrice.innerHTML = 'Price';
            listHeadItem.appendChild(listHeadItemPrice);
            //
            let listHeadItemStock = document.createElement('td');
            listHeadItemStock.innerHTML = 'Stock';
            listHeadItem.appendChild(listHeadItemStock);
            //
            let listHeadItemQuantity = document.createElement('td');
            listHeadItemQuantity.innerHTML = 'Quantity';
            listHeadItem.appendChild(listHeadItemQuantity);
            //
            let listHeadItemSubtotal = document.createElement('td');
            listHeadItemSubtotal.innerHTML = 'Subtotal';
            listHeadItem.appendChild(listHeadItemSubtotal);
            //
            let listHeadItemActions = document.createElement('td');
            listHeadItemActions.innerHTML = '';
            listHeadItem.appendChild(listHeadItemActions);

            listHead.appendChild(listHeadItem);
            list.appendChild(listHead);

            let listBody = document.createElement('tbody');

            let cartItemIds = [];

            cartItems.forEach(v => {
                cartItemIds.push(v.product.id);

                let item = document.createElement('tr');
                item.id = `tr_${v.product.id}`;

                let itemNameWithImage = document.createElement('td');
                itemNameWithImage.align = 'left';
                // Adding Item Image
                let itemImage = document.createElement('img');
                itemImage.style = `width: 60px`;
                itemImage.classList.add('avatar');
                if (v.product.images.length > 0) {
                    itemImage.src = `${get_media_url()}${v.product.images[0]}`;
                }
                itemNameWithImage.appendChild(itemImage);

                // Adding Item Name
                let itemName = document.createElement('b');
                itemName.innerText = `${v.product.name}`;
                itemName.style = `font-size: 22px;padding-left: 25px;`;

                itemNameWithImage.appendChild(itemName);

                let attributeList = [];
                if (v.product.attributes !== null && v.product.attributes.length > 0) {
                    let selectDiv = document.createElement('div');

                    v.product.attributes.forEach(a => {
                        let itemSelect = document.createElement('select');
                        itemSelect.classList.add('form-control', 'mt-1', 'm-1');
                        itemSelect.style = `width: 120px;display: inline`;
                        itemSelect.onchange = function (e) {
                            on_product_attribute_selected(v.product.id, a.id, e.target.value);
                        }

                        attributeList.push({
                            id: a.id,
                            name: a.name,
                            is_required: a.isRequired,
                        });

                        let itemSelectOption = document.createElement('option');
                        itemSelectOption.value = a.name;
                        itemSelectOption.innerText = a.name;
                        itemSelectOption.disabled = true;
                        itemSelectOption.selected = true;
                        itemSelect.appendChild(itemSelectOption);

                        a.values.forEach(vv => {
                            let itemSelectOption = document.createElement('option');
                            itemSelectOption.value = vv;
                            itemSelectOption.innerText = vv;
                            itemSelectOption.selected = get_required_attribute_value(v.product.id, a.id) === vv;
                            itemSelect.appendChild(itemSelectOption);
                        })

                        selectDiv.appendChild(itemSelect);
                    });

                    itemNameWithImage.appendChild(selectDiv);
                }

                set_required_attributes(v.product.id, attributeList);
                item.appendChild(itemNameWithImage);

                let discount = 0;

                // Adding Item Price
                let itemPrice = document.createElement('td');
                itemPrice.align = 'center';
                itemPrice.innerText = `${formatAmount(v.purchasePrice)} ${get_currency()}`;
                if (v.product.productSpecificDiscount !== null && v.product.productSpecificDiscount !== 0) {
                    discount = (v.purchasePrice * v.product.productSpecificDiscount) / 100;
                    itemPrice.innerText = `${formatAmount(v.purchasePrice - discount)} ${get_currency()}`;
                    itemPrice.innerText = itemPrice.innerText + ` (${v.product.productSpecificDiscount}% Off)`;
                }
                itemPrice.id = `price_${v.product.id}`;
                item.appendChild(itemPrice);

                // Adding Item Stock
                let itemStock = document.createElement('td');
                itemStock.align = 'center';
                itemStock.innerText = `${v.product.stock}`;
                item.appendChild(itemStock);

                // Adding Item Quantity
                let itemQuantity = document.createElement('td');
                let itemQuantityMinus = document.createElement('span');
                itemQuantityMinus.innerText = '-';
                itemQuantityMinus.onclick = function () {
                    onQuantityDown(v.product.id);
                };
                itemQuantity.appendChild(itemQuantityMinus);
                let itemQuantityInput = document.createElement('span');
                itemQuantityInput.innerText = `${v.quantity}`;
                itemQuantityInput.id = `quantity_${v.product.id}`;
                itemQuantityInput.style = `padding-left: 15px;padding-right: 15px;`;
                itemQuantity.appendChild(itemQuantityInput);
                let itemQuantityPlus = document.createElement('span');
                itemQuantityPlus.innerText = '+';
                itemQuantityPlus.onclick = function () {
                    onQuantityUp(v.product.id, v.product.stock);
                };
                itemQuantity.appendChild(itemQuantityPlus);
                item.appendChild(itemQuantity);

                // Adding Item Subtotal
                let itemSubtotal = document.createElement('td');
                itemSubtotal.align = 'center';
                itemSubtotal.innerText = `${formatAmount((v.purchasePrice - discount) * v.quantity)} ${get_currency()}`;
                itemSubtotal.id = `subtotal_${v.product.id}`;
                item.appendChild(itemSubtotal);

                // Adding remove button
                let itemRemove = document.createElement('td');
                itemRemove.align = 'right';
                let itemRemoveBtn = document.createElement('button');
                itemRemoveBtn.innerText = 'Remove';
                itemRemoveBtn.classList.add('btn', 'btn-danger');
                itemRemoveBtn.onclick = function () {
                    onItemRemove(v.product.id);
                }
                itemRemove.appendChild(itemRemoveBtn);

                item.appendChild(itemRemove);

                listBody.appendChild(item);
            });

            set_cart_item_ids(cartItemIds);

            list.appendChild(listBody);

            let continueShoppingBtn = document.createElement('button');
            continueShoppingBtn.classList.add('btn', 'btn-secondary', 'mt-2');
            continueShoppingBtn.innerText = 'Continue Shopping';
            continueShoppingBtn.onclick = function () {
                swal.close();
            }

            let checkoutBtn = document.createElement('button');
            checkoutBtn.classList.add('btn', 'btn-primary', 'mt-2');
            checkoutBtn.innerText = 'Checkout';
            checkoutBtn.onclick = function () {
                show_checkout();
            }

            if (cartItems.length !== 0) {
                let tableFooter = document.createElement('tfoot');
                let tr = document.createElement('tr');

                let tdContinue = document.createElement('td');
                tdContinue.align = 'right';
                tdContinue.colSpan = 5;
                tdContinue.appendChild(continueShoppingBtn);
                let tdCheckout = document.createElement('td');
                tdCheckout.align = 'right';
                tdCheckout.colSpan = 1;
                tdCheckout.appendChild(checkoutBtn);

                tr.appendChild(tdContinue);
                tr.appendChild(tdCheckout);
                tableFooter.appendChild(tr);
                list.appendChild(tableFooter);
            }

            swal({
                text: 'Cart Summary',
                content: list,
                buttons: false
            });
        } else {
            alert('Failed to retrieve cart');
        }
    }, function (err) {
        alert('Failed to send request');
    })
}

function on_product_attribute_selected(key, attribute, selected_value) {
    set_required_attribute_value(key, attribute, selected_value);
    update_cart(function (result) {
        if (result.data === null) {
            alert(result.errors[0].message);
        }
    }, function (err) {
        alert('Failed to send request');
    })
}

function set_is_shipping_required(v) {
    localStorage.setItem('is_shipping_required', v);
}

function is_shipping_required() {
    return localStorage.getItem('is_shipping_required') !== null || localStorage.getItem('is_shipping_required') === true;
}

function set_subtotal(v) {
    localStorage.setItem('subtotal', v);
}

function get_subtotal() {
    return localStorage.getItem('subtotal') === null ? 0 : Number(localStorage.getItem('subtotal'));
}

function set_discount(v) {
    localStorage.setItem('discount', v);
}

function get_discount() {
    return localStorage.getItem('discount') === null ? 0 : Number(localStorage.getItem('discount'));
}

function set_shipping_charge(v) {
    localStorage.setItem('shipping_charge', v);
}

function get_shipping_charge() {
    return localStorage.getItem('shipping_charge') === null ? 0 : Number(localStorage.getItem('shipping_charge'));
}

function set_payment_fee(v) {
    localStorage.setItem('payment_fee', v);
}

function get_payment_fee() {
    return localStorage.getItem('payment_fee') === null ? 0 : Number(localStorage.getItem('payment_fee'));
}

function update_grand_total() {
    let grand_total = (get_subtotal() + get_shipping_charge() + get_payment_fee()) - get_discount();
    localStorage.setItem('grand_total', String(grand_total));
}

function get_grand_total() {
    return localStorage.getItem('grand_total') === null ? 0 : Number(localStorage.getItem('grand_total'));
}

function show_checkout() {
    let cartItemIds = get_cart_item_ids()
    if (cartItemIds !== null && cartItemIds.length !== 0) {
        if (get_customer_access_token() === null) {
            show_login_form()
            return
        }
        for (let i = 0; i < cartItemIds.length; i++) {
            if (!check_if_required_attributes_selected(cartItemIds[i])) {
                return;
            }
        }

        set_subtotal(0);
        set_discount(0);
        set_shipping_charge(0);
        set_payment_fee(0);
        update_grand_total();

        let locationPayload = {
            'query': `query { locations { id name shortCode } }`
        };
        sendRequest(locationPayload, function (locationResult) {
            if (locationResult.data !== null) {
                let paymentMethodPayload = {
                    'query': `query { paymentMethods { id displayName currencyName currencySymbol isDigitalPayment } }`
                };
                sendRequest(paymentMethodPayload, function (paymentMethodResult) {
                    if (paymentMethodResult.data !== null) {
                        let shippingMethodPayload = {
                            'query': `query { shippingMethods { id displayName deliveryCharge deliveryTimeInDays WeightUnit isFlat isActive } }`
                        };
                        sendRequest(shippingMethodPayload, function (shippingMethodResult) {
                            if (shippingMethodResult.data !== null) {
                                load_checkout(locationResult.data.locations, paymentMethodResult.data.paymentMethods,
                                    shippingMethodResult.data.shippingMethods);
                                return
                            }
                            alert('Failed to initiate checkout');
                            show_cart();
                        }, function (err) {
                            alert('Failed to send request');
                            show_cart();
                        })
                        return
                    }
                    alert('Failed to initiate checkout');
                    show_cart();
                }, function (err) {
                    alert('Failed to send request');
                    show_cart();
                })
                return
            }
            alert('Failed to initiate checkout');
            show_cart();
        }, function (err) {
            alert('Failed to send request');
            show_cart();
        });
    }
}

function load_checkout(locations, paymentMethods, shippingMethods) {
    let checkoutDiv = document.createElement('div');
    let shippingMethodList = `<option value="none" disabled selected>Select Shipping Method</option>`;
    shippingMethods.forEach(v => {
        shippingMethodList += `<option value="${v.id}">${v.displayName}</option>`;
    });
    let paymentMethodList = `<option value="none" disabled selected>Select Payment Method</option>`;
    paymentMethods.forEach(v => {
        paymentMethodList += `<option value="${v.id}">${v.displayName}</option>`
    });
    let locationList = `<option value="none" disabled selected>Select Location</option>`;
    locations.forEach(v => {
        locationList += `<option value="${v.id}">${v.name}</option>`
    });

    checkoutDiv.innerHTML = `
    <form class="login-form mt-4 mb-2" style="margin-right: 5%; margin-left: 5%">
    <div class="row">
        <div class="row col-md-6">
            <div class="col-md-12">
                <table class="table">
                    <tr>
                        <td class="text-info">Subtotal</td>
                        <td id="subtotal">0.00 ${get_currency()}</td>
                    </tr>
                    <tr ${is_shipping_required() === false ? 'hidden' : ''}>
                        <td class="text-info">Shipping Charge</td>
                        <td id="shipping_charge">0.00 ${get_currency()}</td>
                    </tr>
                    <tr>
                        <td class="text-info">Payment Fee</td>
                        <td id="payment_fee">0.00 ${get_currency()}</td>
                    </tr>
                    <tr>
                        <td class="text-info">Discount</td>
                        <td id="discount">0.00 ${get_currency()}</td>
                    </tr>
                    <tr>
                        <td class="text-primary text-bold">Grand Total</td>
                        <td id="grand_total" class="text-primary text-bold">0.00 ${get_currency()}</td>
                    </tr>
                </table>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form">
                        <input type="text" class="form-control ps-5" placeholder="Coupon Code" id="coupon_code">
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form">
                        <a class="btn btn-secondary form-control" id="apply_coupon_btn">Apply Coupon</a>
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form">
                        <a class="btn btn-secondary form-control" id="goto_cart_btn">Goto Cart</a>
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form">
                        <button class="btn btn-primary form-control" id="place_order_btn">Place Order</button>
                    </div>
                </div>
            </div><!--end col-->
            
            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form">
                        <button onclick="logout()" class="btn btn-outline-info form-control" id="place_order_btn">Logout</button>
                    </div>
                </div>
            </div><!--end col-->
        </div>
        <div class="row col-md-6">
            <label class="form-label">${is_shipping_required() === true ? 'Shipping Information' : 'Billing Information'}</label>

            <div class="col-md-12">
                <div class="mb-3">
                    <div class="form position-relative">
                        <input type="text" class="form-control ps-5" placeholder="Street" id="street">
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-12">
                <div class="mb-3">
                    <div class="form position-relative">
                        <input type="text" class="form-control ps-5" placeholder="Street Optional"
                               id="street_optional">
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form position-relative">
                        <input type="text" class="form-control ps-5" placeholder="City" id="city">
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form position-relative">
                        <input type="text" class="form-control ps-5" placeholder="State" id="state">
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form position-relative">
                        <input type="text" class="form-control ps-5" placeholder="Postcode" id="postcode">
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form position-relative">
                        <input type="text" class="form-control ps-5" placeholder="Email" id="email">
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form position-relative">
                        <input type="text" class="form-control ps-5" placeholder="Phone" id="phone">
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form position-relative">
                        <select class="form-control" id="location">
                            ${locationList}
                        </select>
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6" ${is_shipping_required() !== true ? 'hidden' : ''}>
                <div class="mb-3">
                    <label class="form-label">Shipping Method <span class="text-danger">*</span></label>
                    <div class="form position-relative">
                        <select class="form-control" id="shipping_method">
                            ${shippingMethodList}
                        </select>
                    </div>
                </div>
            </div><!--end col-->

            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Payment Method <span class="text-danger">*</span></label>
                    <div class="form position-relative">
                        <select class="form-control" id="payment_method">
                            ${paymentMethodList}
                        </select>
                    </div>
                </div>
            </div><!--end col-->
        </div>
    </div><!--end row-->
    </form>
    `;

    swal({
        text: 'Place Order',
        content: checkoutDiv,
        buttons: false,
    });

    let eleGotoCart = document.getElementById('goto_cart_btn');
    eleGotoCart.onclick = function () {
        show_cart();
    };
    let eleApplyCoupon = document.getElementById('apply_coupon_btn');
    eleApplyCoupon.onclick = function () {
        check_discount();
    };

    let elePlaceOrder = document.getElementById('place_order_btn');
    elePlaceOrder.onclick = function (e) {
        e.preventDefault();
        place_order();
    }

    let eleStreet = document.getElementById('street');
    eleStreet.onchange = function () {
        if (eleStreet.value !== '') {
            eleStreet.required = false;
        }
    }
    let eleCity = document.getElementById('city');
    eleCity.onchange = function () {
        if (eleCity.value !== '') {
            eleCity.required = false;
        }
    }
    let elePostcode = document.getElementById('postcode');
    elePostcode.onchange = function () {
        if (elePostcode.value !== '') {
            elePostcode.required = false;
        }
    }
    let eleEmail = document.getElementById('email');
    eleEmail.onchange = function () {
        if (eleEmail.value !== '') {
            eleEmail.required = false;
        }
    }
    let elePhone = document.getElementById('phone');
    elePhone.onchange = function () {
        if (elePhone.value !== '') {
            elePhone.required = false;
        }
    }
    let eleLocation = document.getElementById('location');
    eleLocation.onchange = function () {
        if (eleLocation.value !== '') {
            eleLocation.required = false;
        }
    }
    let eleShippingMethod = document.getElementById('shipping_method');
    eleShippingMethod.onchange = function () {
        check_shipping_charge(eleShippingMethod.value);
        eleShippingMethod.required = false;
    };
    let elePaymentMethod = document.getElementById('payment_method');
    elePaymentMethod.onchange = function () {
        check_payment_fee(elePaymentMethod.value);
        elePaymentMethod.required = false;
    };

    set_bills();
}

function logout() {
    set_customer_access_token(null);
    show_login_form();
}

function place_order() {
    let isEmptyRequiredField = false;
    let eleStreet = document.getElementById('street');
    if (eleStreet.value === '') {
        eleStreet.required = true;
        isEmptyRequiredField = true;
    }
    let streetOptional = document.getElementById('street_optional');

    let eleCity = document.getElementById('city');
    if (eleCity.value === '') {
        eleCity.required = true;
        isEmptyRequiredField = true;
    }
    let elePostcode = document.getElementById('postcode');
    if (elePostcode.value === '') {
        elePostcode.required = true;
        isEmptyRequiredField = true;
    }
    let eleLocation = document.getElementById('location');
    if (eleLocation.value === 'none') {
        eleLocation.required = true;
        isEmptyRequiredField = true;
    }
    let state = document.getElementById('state');

    let eleEmail = document.getElementById('email');
    if (eleEmail.value === '') {
        eleEmail.required = true;
        isEmptyRequiredField = true;
    }
    let elePhone = document.getElementById('phone');
    if (elePhone.value === '') {
        elePhone.required = true;
        isEmptyRequiredField = true;
    }

    if (is_shipping_required()) {
        let eleShippingMethod = document.getElementById('shipping_method');
        if (eleShippingMethod.value === 'none') {
            eleShippingMethod.required = true;
            isEmptyRequiredField = true;
        }
    }

    let elePaymentMethod = document.getElementById('payment_method');
    if (elePaymentMethod.value === 'none') {
        elePaymentMethod.required = true;
        isEmptyRequiredField = true;
    }

    if (isEmptyRequiredField) {
        return
    }
    let shippingQuery = ``;
    if (is_shipping_required()) {
        let eleShippingMethod = document.getElementById('shipping_method');
        shippingQuery = `shippingAddress: { street: "${eleStreet.value}" streetTwo: "${streetOptional.value}" city: "${eleCity.value}" state: "${state.value}" postcode: "${elePostcode.value}" email: "${eleEmail.value}" phone: "${elePhone.value}" locationId: "${eleLocation.value}" } shippingMethodId: "${eleShippingMethod.value}"`;
    }
    let eleCouponCode = document.getElementById('coupon_code');
    let couponCodeQuery = ``;
    if (eleCouponCode.value.trim() !== '') {
        couponCodeQuery = `couponCode: "${eleCouponCode.value.trim()}"`;
    }
    let orderPayload = {
        'query': `mutation { orderCheckout(params: { cartId: "${get_cart_id()}" billingAddress: { street: "${eleStreet.value}" streetTwo: "${streetOptional.value}" city: "${eleCity.value}" state: "${state.value}" postcode: "${elePostcode.value}" email: "${eleEmail.value}" phone: "${elePhone.value}" locationId: "${eleLocation.value}" } ${shippingQuery} paymentMethodId: "${elePaymentMethod.value}" ${couponCodeQuery} }) { id hash paymentMethod { isDigitalPayment } } }`
    };
    sendRequest(orderPayload, function (result) {
        if (result.data !== null) {
            let orderId = result.data.orderCheckout.id;
            if (result.data.orderCheckout.paymentMethod.isDigitalPayment) {
                generate_payment_nonce(orderId);
                return
            }

            clear_cache();
            swal({
                title: "Congrats!",
                text: "Your order has been placed! You should receive an email with order details shortly.",
                icon: "success",
                button: false,
            });
            return;
        }
        alert('Failed to place order');
    }, function (err) {
        alert('Failed to send request');
    });
}

function generate_payment_nonce(orderId) {
    let generateNoncePayload = {
        'query': `mutation { orderGeneratePaymentNonce(orderId: "${orderId}") { PaymentGatewayName Nonce StripePublishableKey } }`
    };
    sendRequest(generateNoncePayload, function (result) {
        if (result.data !== null) {
            clear_cache();

            let gatewayName = result.data.orderGeneratePaymentNonce.PaymentGatewayName;
            let nonce = result.data.orderGeneratePaymentNonce.Nonce;
            let stripeKey = result.data.orderGeneratePaymentNonce.StripePublishableKey;
            if (gatewayName === 'Stripe') {
                let stripe = Stripe(stripeKey);
                return stripe.redirectToCheckout({sessionId: nonce});
            } else if (gatewayName === 'SSLCommerz') {
                window.location.href = nonce;
            } else {
                swal({
                    title: "Congrats!",
                    text: "Your order has been placed! You should receive an email with order details shortly.",
                    icon: "success",
                    button: false,
                });
            }
        }
    }, function (err) {
        alert('Failed to generate payment nonce');
    });
}

function clear_cache() {
    set_subtotal(0);
    set_payment_fee(0);
    set_shipping_charge(0);
    update_grand_total();
    set_cart_id(null);
    set_cart_item_ids([]);
}

function check_shipping_charge(id) {
    let payload = {
        'query': `query { checkShippingCharge(cartId: "${get_cart_id()}", shippingMethodId: "${id}") }`
    };
    sendRequest(payload, function (result) {
        if (result.data !== null) {
            let shippingCharge = result.data.checkShippingCharge;

            let eleShippingCharge = document.getElementById('shipping_charge');
            eleShippingCharge.innerText = `${formatAmount(shippingCharge)} ${get_currency()}`;
            set_shipping_charge(shippingCharge);

            update_grand_total();
            let eleGrandTotal = document.getElementById('grand_total');
            eleGrandTotal.innerText = `${formatAmount(get_grand_total())} ${get_currency()}`;

            // Re checking payment processing fee
            let elePayment = document.getElementById('payment_method');
            if (elePayment.value !== 'none') {
                check_payment_fee(elePayment.value);
            }
        }
    }, function (err) {
        alert('Failed to get shipping charge');
    })
}

function check_payment_fee(id) {
    let shippingQuery = ``;
    let eleShippingMethod = document.getElementById('shipping_method');
    if (eleShippingMethod.value !== 'none') {
        shippingQuery += `shippingMethodId: "${eleShippingMethod.value}"`;
    }

    let payload = {
        'query': `query { checkPaymentProcessingFee(cartId: "${get_cart_id()}" paymentMethodId: "${id}" ${shippingQuery}) }`
    };
    sendRequest(payload, function (result) {
        if (result.data !== null) {
            let fee = result.data.checkPaymentProcessingFee;

            let eleFee = document.getElementById('payment_fee');
            eleFee.innerText = `${formatAmount(fee)} ${get_currency()}`;
            set_payment_fee(fee);

            update_grand_total();
            let eleGrandTotal = document.getElementById('grand_total');
            eleGrandTotal.innerText = `${formatAmount(get_grand_total())} ${get_currency()}`;
        }
    }, function (err) {
        alert('Failed to get payment processing fee');
    })
}

function set_bills() {
    let cartPayload = {
        'query': `query { cart(cartId: "${get_cart_id()}") { id isShippingRequired cartItems { id purchasePrice quantity product { id name slug description sku stock price isDigitalProduct productSpecificDiscount images attributes { id name values isRequired } } } } }`
    }
    sendRequest(cartPayload, function (result) {
        if (result.data !== null) {
            let eleSubtotal = document.getElementById('subtotal');
            let subtotal = 0;
            result.data.cart.cartItems.forEach(v => {
                let price = v.purchasePrice;
                let quantity = v.quantity;
                let discount = v.product.productSpecificDiscount !== null ? v.product.productSpecificDiscount : 0;
                price = price - ((price * discount) / 100);
                subtotal += price * quantity;
            });
            eleSubtotal.innerText = `${formatAmount(subtotal)} ${get_currency()}`;
            set_subtotal(subtotal);
            update_grand_total();

            let eleGrandTotal = document.getElementById('grand_total');
            eleGrandTotal.innerText = `${formatAmount(get_grand_total())} ${get_currency()}`;
        }
    }, function (err) {
        alert('Failed to get cart info');
    })
}

function check_discount() {
    let coupon = document.getElementById('coupon_code').value;
    if (coupon.trim() === '') {
        return
    }

    let shippingMethodQuery = ``;
    let shippingMethodId = document.getElementById('shipping_method').value;
    if (shippingMethodId !== null && shippingMethodId !== undefined && shippingMethodId !== 'none') {
        shippingMethodQuery = `shippingMethodId: "${shippingMethodId}"`
    }
    let payload = {
        'query': `query { checkDiscount(couponCode: "${coupon}" cartId: "${get_cart_id()}" ${shippingMethodQuery}) }`
    };

    sendRequest(payload, function (result) {
        if (result.data !== null) {
            let discount = result.data.checkDiscount;
            let eleDiscount = document.getElementById('discount');
            eleDiscount.innerText = `${formatAmount(discount)} ${get_currency()}`;
            set_discount(discount);
            update_grand_total();

            let eleGrandTotal = document.getElementById('grand_total');
            eleGrandTotal.innerText = `${formatAmount(get_grand_total())} ${get_currency()}`;
            return
        }

        alert(result.errors[0].message);
    }, function (err) {
        console.log(err);
        alert('Failed to send request');
    })
}

function show_login_form() {
    let loginDiv = document.createElement('div');
    loginDiv.innerHTML = `
    <form class="login-form mt-4" style="margin-left: 30%; margin-right: 30%">
    <div class="row">
        <div class="col-lg-12">
            <div class="mb-3">
                <label class="form-label">Your Email <span class="text-danger">*</span></label>
                <div class="form position-relative">
                    <input type="email" class="form-control ps-5" placeholder="Your Email" name="email" id="email"
                           required>
                </div>
            </div>
        </div><!--end col-->

        <div class="col-lg-12">
            <div class="mb-3">
                <label class="form-label">Your Password <span class="text-danger">*</span></label>
                <div class="form position-relative">
                    <input type="password" class="form-control ps-5" placeholder="Your Password" id="password" required>
                </div>
            </div>
        </div><!--end col-->

        <div class="col-lg-12">
            <div class="d-flex justify-content-between">
                <div class="mb-3">
                </div>
                <p class="forgot-pass mb-0"><a id="forget_password_btn" class="text-dark fw-bold">Forgot
                    password ?</a></p>
            </div>
        </div><!--end col-->

        <div class="col-lg-12 mb-0">
            <div class="d-grid">
                <button class="btn btn-primary" id="login_btn">Login</button>
            </div>
        </div><!--end col-->

        <div class="col-12 text-center">
            <p class="mb-0 mt-3"><small class="text-dark me-2">Don't have an account ?</small> <a
                    class="text-dark fw-bold" id="register_btn">Sign Up</a></p>
        </div><!--end col-->
    </div><!--end row-->
    </form>
    `;

    swal({
        text: 'Login',
        content: loginDiv,
        buttons: false,
    });

    let eleLogin = document.getElementById('login_btn');
    eleLogin.onclick = function (ev) {
        ev.preventDefault();
        login_customer();
    };
    let eleRegister = document.getElementById('register_btn');
    eleRegister.onclick = function (ev) {
        ev.preventDefault();
        show_register_form();
    };
    let eleForgetPassword = document.getElementById('forget_password_btn');
    eleForgetPassword.onclick = function (ev) {
        ev.preventDefault();
        show_forget_password_form();
    };
}

function login_customer() {
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let payload = {
        'query': `mutation { customerLogin(params: { email: "${email}" password: "${encodeURIComponent(password)}" }) { accessToken } }`
    };
    sendRequest(payload, function (result) {
        if (result.data !== null) {
            set_customer_access_token(result.data.customerLogin.accessToken);
            show_checkout();
            return
        }
        alert('Email or password is incorrect');
        show_login_form();
    }, function (err) {
        console.log(err);
        alert('Failed to send request');
        show_login_form();
    })
}

function show_register_form() {
    let registerDiv = document.createElement('div');
    registerDiv.innerHTML = `
    <form class="login-form mt-4" style="margin-right: 30%; margin-left: 30%">
    <div class="row">
        <div class="col-md-6">
            <div class="mb-3">
                <label class="form-label">First name <span class="text-danger">*</span></label>
                <div class="form position-relative">
                    <input type="text" class="form-control ps-5" placeholder="First Name" id="first_name" required>
                </div>
            </div>
        </div><!--end col-->

        <div class="col-md-6">
            <div class="mb-3">
                <label class="form-label">Last name <span class="text-danger">*</span></label>
                <div class="form position-relative">
                    <input type="text" class="form-control ps-5" placeholder="Last Name" id="last_name" required>
                </div>
            </div>
        </div><!--end col-->

        <div class="col-md-12">
            <div class="mb-3">
                <label class="form-label">Your Email <span class="text-danger">*</span></label>
                <div class="form position-relative">
                    <input type="email" class="form-control ps-5" placeholder="Your Email" id="email" required>
                </div>
            </div>
        </div><!--end col-->

        <div class="col-md-12">
            <div class="mb-3">
                <label class="form-label">Password <span class="text-danger">*</span></label>
                <div class="form position-relative">
                    <input type="password" class="form-control ps-5" placeholder="Your Password" id="password" required>
                </div>
            </div>
        </div><!--end col-->

        <div class="col-md-12">
            <div class="d-grid">
                <button class="btn btn-primary" id="register_btn">Register</button>
            </div>
        </div><!--end col-->
        
        <div class="mx-auto">
            <p class="mb-0 mt-3"><small class="text-dark me-2">Already have an account ?</small> <a
                    id="login_btn" class="text-dark fw-bold">Login</a></p>
        </div>
    </div><!--end row-->
    </form>
    `;

    swal({
        text: 'Register',
        content: registerDiv,
        buttons: false,
    });

    let eleRegister = document.getElementById('register_btn');
    eleRegister.onclick = function (ev) {
        ev.preventDefault();
        register_customer();
    }
    let eleLogin = document.getElementById('login_btn');
    eleLogin.onclick = function (ev) {
        ev.preventDefault();
        show_login_form();
    }
}

function register_customer() {
    let firstName = document.getElementById('first_name').value;
    let lastName = document.getElementById('last_name').value;
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let payload = {
        'query': `mutation { customerRegister(params: { firstName: "${firstName}" lastName: "${lastName}" email: "${email}" password: "${encodeURIComponent(password)}" }) { accessToken } }`
    };
    sendRequest(payload, function (result) {
        if (result.data !== null) {
            set_customer_access_token(result.data.customerRegister.accessToken);
            return
        }
        alert('Email address already registered');
    }, function (err) {
        alert('Failed to send request');
    })
}

function show_forget_password_form() {
    let forgetPasswordDiv = document.createElement('div');
    forgetPasswordDiv.innerHTML = `
    <form class="login-form mt-4" style="margin-left: 30%; margin-right: 30%">
    <div class="row">
        <div class="col-lg-12">
            <div class="mb-3">
                <label class="form-label">Your Email <span class="text-danger">*</span></label>
                <div class="form position-relative">
                    <input type="email" class="form-control ps-5" placeholder="Your Email" name="email" id="email"
                           required>
                </div>
            </div>
        </div><!--end col-->

        <div class="col-lg-12 mb-0">
            <div class="d-grid">
                <button class="btn btn-primary" id="send_code_btn">Send Reset Code</button>
            </div>
        </div><!--end col-->

        <div class="col-12 text-center">
            <p class="mb-0 mt-3"><small class="text-dark me-2">Remember your password ?</small> <a
                    class="text-dark fw-bold" id="login_btn">Login</a></p>
        </div><!--end col-->
    </div><!--end row-->
    </form>
    `;

    swal({
        text: 'Reset Password',
        content: forgetPasswordDiv,
        buttons: false,
    });

    let eleLogin = document.getElementById('login_btn');
    eleLogin.onclick = function (ev) {
        ev.preventDefault();
        show_login_form();
    };
    let eleForgetPassword = document.getElementById('send_code_btn');
    eleForgetPassword.onclick = function (ev) {
        ev.preventDefault();
        customer_forget_password();
    };
}

function customer_forget_password() {
    let email = document.getElementById('email').value;
    let payload = {
        'query': `mutation { customerResetPasswordRequest(params: { email: "${email}" }) }`
    };
    sendRequest(payload, function (result) {
        if (result.data !== null) {
            alert('If you have an account with the provided email, you will get an email with reset code shortly.');
            show_change_password_form(email);
            return
        }
        alert('Unable to send password reset code');
        show_login_form();
    }, function (err) {
        console.log(err);
        alert('Failed to send request');
        show_login_form();
    })
}

function show_change_password_form(email) {
    let changePasswordDiv = document.createElement('div');
    changePasswordDiv.innerHTML = `
    <form class="login-form mt-4" style="margin-left: 30%; margin-right: 30%">
    <div class="row">
        <div class="col-lg-12">
            <div class="mb-3">
                <input type="hidden" id="email" value="${email}">
                <label class="form-label">Code <span class="text-danger">*</span></label>
                <div class="form position-relative">
                    <input type="text" class="form-control ps-5" placeholder="Code" id="code"
                           required>
                </div>
            </div>
        </div><!--end col-->
        <div class="col-lg-12">
            <div class="mb-3">
                <label class="form-label">New Password <span class="text-danger">*</span></label>
                <div class="form position-relative">
                    <input type="password" class="form-control ps-5" placeholder="New Password" id="new_password"
                           required>
                </div>
            </div>
        </div><!--end col-->
        <div class="col-lg-12">
            <div class="mb-3">
                <label class="form-label">Confim Password <span class="text-danger">*</span></label>
                <div class="form position-relative">
                    <input type="password" class="form-control ps-5" placeholder="Confim Password" id="confirm_password"
                           required>
                </div>
            </div>
        </div><!--end col-->

        <div class="col-lg-12 mb-0">
            <div class="d-grid">
                <button class="btn btn-primary" id="change_password_btn">Change Password</button>
            </div>
        </div><!--end col-->

        <div class="col-12 text-center">
            <p class="mb-0 mt-3"><small class="text-dark me-2">Didn't get code?</small> <a
                    class="text-dark fw-bold" id="resend_code_btn">Resend Code</a></p>
        </div><!--end col-->
    </div><!--end row-->
    </form>
    `;

    swal({
        text: 'Change Password',
        content: changePasswordDiv,
        buttons: false,
    });

    let eleChangePassword = document.getElementById('change_password_btn');
    eleChangePassword.onclick = function (ev) {
        ev.preventDefault();
        customer_change_password();
    };
    let eleResendCode = document.getElementById('resend_code_btn');
    eleResendCode.onclick = function (ev) {
        ev.preventDefault();
        show_forget_password_form();
    };
}

function customer_change_password() {
    let code = document.getElementById('code').value;
    let newPassword = document.getElementById('new_password').value;
    let confirmPassword = document.getElementById('confirm_password').value;
    if (newPassword !== confirmPassword) {
        alert('Password mismatched');
        return
    }

    let email = document.getElementById('email').value;
    let payload = {
        'query': `mutation { customerResetPassword(params: { email: "${email}" resetToken: "${code}" newPassword: "${encodeURIComponent(newPassword)}" }) }`
    };
    sendRequest(payload, function (result) {
        if (result.data !== null) {
            alert('Password has been changed.');
            show_login_form()
            return
        }
        alert('Unable to reset password');
    }, function (err) {
        console.log(err);
        alert('Failed to send request');
        show_login_form();
    })
}

function onItemRemove(itemId) {
    append_recently_removed_id(itemId);
    update_cart(function (result) {
        remove_recently_removed_id(itemId);

        if (result.data === null) {
            alert('Failed to update cart');
            return
        }

        let ele = document.getElementById(`tr_${itemId}`);
        ele.remove();
    }, function (err) {
        alert('Failed to send request');
        remove_recently_removed_id(itemId);
    });
}

function onQuantityUp(itemId, stock) {
    let quantityParam = document.getElementById(`quantity_${itemId}`).innerText;
    quantityParam = quantityParam.trim();
    let quantity = Number(quantityParam);
    if (!(quantity < stock)) {
        return
    }

    let priceParam = document.getElementById(`price_${itemId}`).innerText;
    priceParam = priceParam.split(`${get_currency()}`)[0];
    priceParam = priceParam.trim();
    let price = Number(priceParam) * 100;

    quantity++;
    document.getElementById(`quantity_${itemId}`).innerText = `${quantity}`;
    document.getElementById(`subtotal_${itemId}`).innerText = `${formatAmount(price * quantity)} ${get_currency()}`;

    update_cart(function (result) {
        if (result.data === null) {
            alert(`${result.errors[0].message}`);
        }
    }, function (err) {
        alert('Failed to send request');
    });
}

function onQuantityDown(itemId) {
    let quantityParam = document.getElementById(`quantity_${itemId}`).innerText;
    quantityParam = quantityParam.trim();
    let quantity = Number(quantityParam);
    if (quantity <= 1) {
        return
    }

    let priceParam = document.getElementById(`price_${itemId}`).innerText;
    priceParam = priceParam.split(`${get_currency()}`)[0];
    priceParam = priceParam.trim();
    let price = Number(priceParam) * 100;

    quantity--;
    document.getElementById(`quantity_${itemId}`).innerText = `${quantity}`;
    document.getElementById(`subtotal_${itemId}`).innerText = `${formatAmount(price * quantity)} ${get_currency()}`;

    update_cart(function (result) {
        if (result.data === null) {
            alert('Failed to update cart');
        }
    }, function (err) {
        alert('Failed to send request');
    });
}

function sendRequest(payload, successCallback, failureCallback) {
    $.ajax({
        type: 'POST',
        url: get_api_url(),
        headers: {
            'store-key': get_store_key(),
            'store-secret': get_store_secret(),
            'access-token': get_customer_access_token()
        },
        data: JSON.stringify(payload),
        dataType: 'json',
        contentType: 'application/json'
    }).done(successCallback).fail(failureCallback);
}

function formatAmount(v) {
    return (v / 100).toFixed(2);
}

function get_api_url() {
    return 'https://api.livemart.xyz/query';
}

function get_media_url() {
    return 'https://livemart.xyz/v1/fs/serve/';
}

function get_currency() {
    return JSON.parse(localStorage.getItem('store_info')).currency;
}
