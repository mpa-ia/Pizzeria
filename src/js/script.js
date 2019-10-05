/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

      // console.log('new Product: ', thisProduct);
    }
    renderInMenu () {
      const thisProduct = this;
      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }
    getElements () {
      const thisProduct = this;
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
    initAccordion () {
      const thisProduct = this;
      /* START: click event listener to trigger */
      thisProduct.accordionTrigger.addEventListener('click', function () {
        /* prevent default action for event */
        event.preventDefault();
        /* toggle active class on this element*/
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
        /* find all active products */
        const activeProducts = document.querySelectorAll(select.all.menuProductsActive);
        /* START LOOP: for each active product: */
        for (let activeProduct of activeProducts) {
          /* START: if the active product isn't the element of thisProduct */
          if (activeProduct != thisProduct.element) {
            /* remove class active for this product */
            activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
          /* END: if the active product isn't the element of thisProduct */
          }
        /* END LOOP: for each active product:*/
        }
      /* END: click event listener to trigger */
      });
    }
    initOrderForm () {
      const thisProduct = this;
      // console.log('initOrderForm');
      thisProduct.form.addEventListener('submit', function () {
        event.preventDefault();
        thisProduct.processOrder();
      });
      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          event.preventDefault();
          thisProduct.processOrder();
        });
      }
      thisProduct.cartButton.addEventListener('click', function () {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }
    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      // console.log('formData: ', formData);
      /* [NEW] create object to store chosen option */
      thisProduct.params = {};
      /* declare price variable */
      let price = thisProduct.data.price;
      /* Find all parameters of this product */
      const params = thisProduct.data.params;
      /* START LOOP: for each param of params */
      for (let paramId in params){
        /* Find parameter */
        const param = params[paramId];
        /* START LOOP: for each option in param */
        for (let optionId in param.options){
          /* Find option of parameter */
          const option = param.options[optionId];
          /* Find all images for option */
          const selector = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
          /* Check if option is selected */
          const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;
          /* START IF: NOT-default option is selected */
          if (optionSelected && !option.default) {
            /* add option price to product price */
            price += option.price;
          /* END IF: NOT-default option is selected */
          }
          /* START IF: default option is NOT selected */
          else if (!optionSelected && option.default) {
            /* substract option price from product price*/
            price -= option.price;
            /* END IF: default option is NOT selected */
          }

          /* [FUNCTIONALITY] Choose image depending on selected option */

          /* START IF: option is selected */
          if (optionSelected) {
            if (!thisProduct.params[paramId]) {
              thisProduct.params[paramId] = {
                label: param.label,
                options: {},
              };
            }
            thisProduct.params[paramId].options[optionId] = option.label;
            /* START IF: selector is not null */
            if (selector) {
              /* add class active if statement is true - option is selected */
              selector.classList.add(classNames.menuProduct.imageVisible);
              /* END IF: selector is not null */
            }
          /* END IF: option is selected */
          }
          /* START ELSE: option is not selected */
          else {
            /* START IF: selector is not null */
            if (selector) {
              /* Remove class active if statement is false - option is not selected  */
              selector.classList.remove(classNames.menuProduct.imageVisible);
              /* END IF: selector is not null */
            }
          /* END ELSE: option is not selected */
          }
        }
      }
      thisProduct.priceSingle = price;
      /* multiply price by amount */
      thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;
      /* set the contents of thisProduct.priceElem to be the value of variable price */
      thisProduct.priceElem.innerHTML = thisProduct.price;
      console.log(thisProduct.params);
    }
    initAmountWidget () {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget (thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }
    addToCart () {
      const thisProduct = this;
      thisProduct.name = thisProduct.data.name;
      thisProduct.amount = thisProduct.amountWidget.value;
      app.cart.add(thisProduct);
    }
  }
  class AmountWidget {
    constructor (element) {
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.value = settings.amountWidget.defaultValue;
      thisWidget.setValue(thisWidget.input.value);
      // console.log('Amount Widget: ', thisWidget);
      // console.log('constructor arguments: ', element);

      this.initActions();
    }

    getElements (element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      // console.log(thisWidget.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue (value) {
      const thisWidget = this;
      const newValue = parseInt(value);
      if (value != thisWidget.value && value >= settings.amountWidget.defaultMin && value <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue;
        thisWidget.announce();
      }
      thisWidget.input.value = thisWidget.value;
    }
    initActions () {
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function () {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function () {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    announce (){
      const thisWidget = this;
      const event = new CustomEvent ('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }
  class Cart {
    constructor (element) {
      const thisCart = this;

      thisCart.products = [];
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.getElements(element);
      thisCart.initActions();
      console.log('new Cart: ', thisCart);
    }
    getElements (element) {
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = document.querySelector(select.cart.productList);

      thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];
      for (let key of thisCart.renderTotalsKeys){
        thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
      }
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);

    }
    initActions () {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function () {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function () {
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function () {
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function () {
        event.preventDefault();
        thisCart.sendOrder();
      });
    }
    add (menuProduct) {
      const thisCart = this;
      /* generate HTML based on template */
      const generatedHTML = templates.cartProduct(menuProduct);
      /* create element using utils.createElementFromHTML */
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      /* add element to cart */
      thisCart.dom.productList.appendChild(generatedDOM);
      console.log('adding product: ', menuProduct);

      thisCart.products.push(new CartProduct (menuProduct, generatedDOM));
      console.log('thisCart.products', thisCart.products);
      thisCart.update();
    }
    update () {
      const thisCart = this;
      /* declare totalNumber & subtotalPrice properties - they will sum up the amount and whole price of all chosen products */
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
      /* START LOOP: for each product of chosen products array */
      for (let product of thisCart.products) {
        /* add product price to subtotalPrice */
        thisCart.subtotalPrice += product.price;
        /* add product amount to totalNumber */
        thisCart.totalNumber += product.amount;
      /* END LOOP: for each product of chosen products array */
      }
      /* add property totalPrice, add deliveryFee to subtotalPrice */
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      for (let key of thisCart.renderTotalsKeys) {
        for (let elem of thisCart.dom[key]) {
          elem.innerHTML = thisCart[key];
        }
      }
    }
    remove (cartProduct) {
      const thisCart = this;
      /* find index of cartProduct in thisCard.products array */
      const index = thisCart.products.indexOf(cartProduct);
      /* remove element with given index */
      thisCart.products.splice(index);
      /* remove DOM element of cartProduct */
      cartProduct.dom.wrapper.remove();
      /* update all sums in cart */
      thisCart.update();
    }
    sendOrder () {
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.order;

      const payload = {
        phone: thisCart.dom.phone.value,
        address: thisCart.dom.address.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };
      for (let product of thisCart.products) {
        const data = product.getData();
        payload.products.push(data);
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      fetch(url, options)
        .then(response => response.json())
        .then(parsedResponse => {
          console.log('parsedResponse: ', parsedResponse);
        });
      thisCart.clearCart();
    }
    clearCart () {
      const thisCart = this;
      /* clear products array */
      thisCart.products.splice(0, thisCart.products.length);
      /* remove DOM elements from  productList */
      thisCart.dom.productList.innerHTML = '';
      /* update sums */
      thisCart.update();
      thisCart.dom.phone.value = '';
      thisCart.dom.address.value = '';
    }
  }
  class CartProduct {
    constructor (menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.amount = menuProduct.amount;

      thisCartProduct.params = JSON.parse(JSON.stringify(menuProduct.params));

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
      // console.log('thisCartProduct', thisCartProduct);
    }
    getElements (element) {
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }
    initAmountWidget () {
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget (thisCartProduct.dom.amountWidget);
      thisCartProduct.amountWidget.element.addEventListener('updated', function () {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }
    remove () {
      const thisCartProduct = this;
      const event = new CustomEvent ('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
    initActions () {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function() {
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function () {
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
    getData () {
      const thisCartProduct = this;
      const productData = {
        id: thisCartProduct.id,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        amount: thisCartProduct.amount,
        params: thisCartProduct.params,
      };
      console.log(productData);
      return productData;
    }
  }
  const app = {
    initMenu: function () {
      const thisApp = this;
      // console.log('thisApp.data: ', thisApp.data);
      for (let productData in thisApp.data.products) {
        new Product (thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
    initCart: function () {
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart (cartElem);
    },
    initData: function () {
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.product;
      fetch(url)
        .then(rawResponse => rawResponse.json())
        .then(parsedResponse => {
          console.log('parsedResponse: ', parsedResponse);
          /* save parsedResponse at thisApp.data.products */
          thisApp.data.products = parsedResponse;
          /* execute initMenu method */
          app.initMenu();
        });


      console.log('thisApp.data: ', JSON.stringify(thisApp.data));
    },
    init: function(){
      const thisApp = this;
      // console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);

      thisApp.initData();
      thisApp.initCart();
    },
  };

  app.init();
}
