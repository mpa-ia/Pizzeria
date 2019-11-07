import {settings, select, classNames,templates} from '../settings.js';
import {utils} from '../utils.js';
import CartProduct from './CartProduct.js';

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
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.form.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.form.address);

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
    thisCart.dom.form.addEventListener('submit', function (event) {
      let isFormValidate = true;
      const submitButton = thisCart.dom.form.querySelector(select.form.formSubmit);

      event.preventDefault();

      if (thisCart.products.length == 0) {
        isFormValidate = false;
        utils.activatePopUp('No product was chosen', isFormValidate);
      } else if (utils.validateInputs(thisCart.dom.form)) {
        utils.activatePopUp('The order has been accepted', isFormValidate);
        thisCart.sendOrder();
      }
      utils.preventSubmit(submitButton);
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
    if (thisCart.products.length == 0) {
      thisCart.deliveryFee = 0;
      thisCart.totalPrice = 0;
    } else {
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    }
    /* add property totalPrice, add deliveryFee to subtotalPrice */

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
    thisCart.products.splice(index, 1);
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
    thisCart.products = [];
    /* remove DOM elements from productList */
    while(thisCart.dom.productList.hasChildNodes()) {
      thisCart.dom.productList.removeChild(thisCart.dom.productList.firstChild);
    }

    /* update sums */
    thisCart.update();
    /* clear form inputs */
    thisCart.dom.phone.value = '';
    thisCart.dom.address.value = '';
  }
}
export default Cart;
