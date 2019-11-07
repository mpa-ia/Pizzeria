import { templates, select, settings, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import {utils} from '../utils.js';

class Booking {
  constructor (element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }
  getData () {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam =  settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      booking:        settings.db.url + '/' + settings.db.booking
                                      + '?' + params.booking.join('&'),
      eventsCurrent:  settings.db.url + '/' + settings.db.event
                                      + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:   settings.db.url + '/' + settings.db.event
                                      + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }
  parseData (bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1))
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
      }
    }
    thisBooking.updateDOM();
  }
  makeBooked (date, hour, duration, table) {
    const thisBooking = this;
    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);

    parseFloat(hour);
    parseFloat(duration);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
        thisBooking.booked[date][hourBlock].push(table);
      } else {
        thisBooking.booked[date][hourBlock].push(table);
      }
    }
  }
  updateDOM () {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = thisBooking.hourPicker.value;

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }
  render (element) {
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;

    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.hourPicker.wrapper);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starter);

    thisBooking.dom.phone = thisBooking.dom.form.querySelector(select.form.phone);
    thisBooking.dom.address = thisBooking.dom.form.querySelector(select.form.address);
  }
  initWidgets () {
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget (thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget (thisBooking.dom.hoursAmount, true);
    thisBooking.datePicker = new DatePicker (thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker (thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      for (let table of thisBooking.dom.tables) {
        table.classList.remove(classNames.booking.tableSelected);
      }
      thisBooking.updateDOM();
    });

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function () {

        if (!table.classList.contains(classNames.booking.tableBooked)) {

          table.classList.toggle(classNames.booking.tableSelected);
          const selectedTables = thisBooking.dom.wrapper.querySelectorAll(select.all.tablesSelected);

          for (let selectedTable of selectedTables) {
            if(selectedTable != this) {
              selectedTable.classList.remove(classNames.booking.tableSelected);
            }
          }
        }

      });
    }
    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      const submitButton = thisBooking.dom.form.querySelector(select.form.formSubmit);

      /* Validation form */
      const selectedTable = thisBooking.dom.wrapper.querySelector(select.booking.tableSelected);
      let tableId = 0;
      if (selectedTable == null) {
        utils.activatePopUp('Choose table', false);
      } else {
        tableId = parseInt(selectedTable.getAttribute(settings.booking.tableIdAttribute));
      }

      if (selectedTable != null
        &&
        thisBooking.checkIfFree(thisBooking.date, thisBooking.hour, thisBooking.hoursAmount.value, tableId)
        &&
        utils.validateInputs(thisBooking.dom.form)
      )
      {
        thisBooking.sendOrder();
      }

      utils.preventSubmit(submitButton);
    });
  }

  checkIfFree (date, hour, duration, table) {
    const thisBooking = this;

    let freeTable = true;
    let availableHoursAmount = parseFloat(0);
    thisBooking.hourPicker.closed = settings.hours.close;

    const startHour = parseFloat(hour);

    for (let hourBlock = startHour; hourBlock < startHour + parseFloat(duration); hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined'
          ||
          !thisBooking.booked[date][hourBlock].includes(table)) {
        availableHoursAmount+=0.5;
      }
      else if (typeof thisBooking.booked[date][hourBlock] != 'undefined' &&
                thisBooking.booked[date][hourBlock].includes(table)) {
        freeTable = false;
        utils.activatePopUp('You can book this table only for ' + (parseFloat(hourBlock) - parseFloat(hour)) + ' hours, later it is not available', freeTable);
        break;
      }
    }

    if (!freeTable) {
      thisBooking.hoursAmount.value = thisBooking.hoursAmount.value - duration + availableHoursAmount;
    } else if (parseFloat(hour) + parseFloat(duration) > parseFloat(thisBooking.hourPicker.closed)) {
      // to finally return false anyway
      freeTable = false;
      utils.activatePopUp('You can book a table only for ' + (thisBooking.hourPicker.closed - startHour) + ' hours', freeTable);
      thisBooking.hoursAmount.value = thisBooking.hourPicker.closed - startHour;
    }
    return !freeTable ? false : true;
  }
  sendOrder () {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const selectedTable = thisBooking.dom.wrapper.querySelector(select.booking.tableSelected);
    const tableId = selectedTable.getAttribute(settings.booking.tableIdAttribute);

    const payload = {
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
      date: thisBooking.date,
      hour: utils.numberToHour(thisBooking.hour),
      table: tableId,
      repeat: false,
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: [],
    };
    for (let starter of thisBooking.dom.starters) {
      if (starter.checked==true){
        payload.starters.push(starter.value);
      }
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
    thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
    utils.activatePopUp('Selected table was booked', true);
    selectedTable.classList.remove(classNames.booking.tableSelected);
    thisBooking.clearForm();
  }
  clearForm () {
    const thisBooking = this;

    thisBooking.peopleAmount.value = 1;
    thisBooking.hoursAmount.value = 1;

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked==true){
        starter.checked = false;
      }
    }
    thisBooking.dom.starters = [];
    thisBooking.dom.phone.value = '';
    thisBooking.dom.address.value = '';
  }
}
export default Booking;
