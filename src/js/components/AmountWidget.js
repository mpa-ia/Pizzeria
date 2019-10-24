import {settings, select} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget {
  constructor (element, isHourWidget = false) {
    super(element, settings.amountWidget.defaultValue);
    const thisWidget = this;
    thisWidget.isHourWidget = isHourWidget;

    thisWidget.getElements(element);

    this.initActions();
  }

  getElements () {
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }
  isValid (value) {
    return !isNaN (value)
    && value >= settings.amountWidget.defaultMin
    && value <= settings.amountWidget.defaultMax;
  }
  renderValue () {
    const thisWidget = this;
    thisWidget.dom.input.value = thisWidget.value;
  }
  initActions () {
    const thisWidget = this;
    thisWidget.dom.input.addEventListener('change', function () {
      thisWidget.setValue(thisWidget.dom.input.value);
    });

    thisWidget.dom.linkDecrease.addEventListener('click', function () {
      event.preventDefault();
      if (thisWidget.isHourWidget) {
        thisWidget.setValue(thisWidget.value - 0.5);

      } else {
        thisWidget.setValue(thisWidget.value - 1);
      }

    });
    thisWidget.dom.linkIncrease.addEventListener('click', function () {
      event.preventDefault();
      if (thisWidget.isHourWidget) {
        thisWidget.setValue(thisWidget.value + 0.5);
      } else {
        thisWidget.setValue(thisWidget.value + 1);
      }
    });
  }

}
export default AmountWidget;
