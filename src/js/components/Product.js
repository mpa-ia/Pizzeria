import {select, templates, classNames} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';

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
    // app.cart.add(thisProduct);

    const event = new CustomEvent ('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });
    thisProduct.element.dispatchEvent(event);
  }
}
export default Product;
