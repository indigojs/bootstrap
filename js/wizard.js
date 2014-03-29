/* ========================================================================
 * Bootstrap: wizard.js v3.1.1
 * http://
 * ======================================================================== */

/*
 * Fuel UX Wizard
 * https://github.com/ExactTarget/fuelux
 *
 * Copyright (c) 2012 ExactTarget
 * Licensed under the MIT license.
 */
+function ($) { "use strict";

	// WIZARD CONSTRUCTOR AND PROTOTYPE

	var Wizard = function (element, options) {
		var kids;

		this.$element    = $(element);
		this.options     = options;
		this.currentStep = this.options.selectedItem.step;
		this.$steps      = this.$element.find('#steps');
		this.numSteps    = this.$steps.children().length;
		this.$prevBtn    = this.$element.find('[data-target=prev]');
		this.$nextBtn    = this.$element.find('[data-target=next]');

		this.options.disablePreviousStep = (this.$element.data('restrict') === "previous") ? true : false;

		kids = this.$nextBtn.children().detach();
		this.nextText = $.trim(this.$nextBtn.text());
		this.$nextBtn.append(kids);

		// handle events
		this.$prevBtn.on('click', $.proxy(this.previous, this));
		this.$nextBtn.on('click', $.proxy(this.next, this));

		this.$element.on('click', this.$steps.selector + '> .complete', $.proxy(this.stepclicked, this));

		if(this.currentStep > 1) {
			this.selectedItem(this.options.selectedItem);
		}

		if(this.options.disablePreviousStep) {
			this.$prevBtn.attr('disabled', true);
			this.$steps.addClass('previous-disabled');
		}
	}

	Wizard.DEFAULTS = {
		selectedItem: {step:1}
	}

	Wizard.prototype = {

		constructor: Wizard,

		setState: function () {
			var canMovePrev = (this.currentStep > 1);
			var firstStep = (this.currentStep === 1);
			var lastStep = (this.currentStep === this.numSteps);

			// disable buttons based on current step
			if(!this.options.disablePreviousStep) {
				this.$prevBtn.attr('disabled', (firstStep === true || canMovePrev === false));
			}

			// change button text of last step, if specified
			var data = this.$nextBtn.data();
			if (data && data.last) {
				this.lastText = data.last;
				if (typeof this.lastText !== 'undefined') {
					// replace text
					var text = (lastStep !== true) ? this.nextText : this.lastText;
					var kids = this.$nextBtn.children().detach();
					this.$nextBtn.text(text).append(kids);
				}
			}

			// reset classes for all steps
			var $steps = this.$steps.children();
			$steps.removeClass('active').removeClass('complete');
			$steps.find('span.badge').removeClass('badge-info').removeClass('badge-success');

			// set class for all previous steps
			var prevSelector = ':lt(' + (this.currentStep - 1) + ')';
			var $prevSteps = this.$steps.children(prevSelector);
			$prevSteps.addClass('complete');
			$prevSteps.find('span.badge').addClass('badge-success');

			// set class for current step
			var currentSelector = ':eq(' + (this.currentStep - 1) + ')';
			var $currentStep = this.$steps.children(currentSelector);
			$currentStep.addClass('active');
			$currentStep.find('span.badge').addClass('badge-info');

			// set display of target element
			var target = $currentStep.data().target;
			this.$element.find('.wizard-body .step-pane').removeClass('active');
			$(target).addClass('active');

			// reset the wizard position to the left
			this.$steps.first().attr('style','margin-left: 0');

			// check if the steps are wider than the container div
			var totalWidth = 0;
			$steps.each(function () {
				totalWidth += $(this).outerWidth();
			});

			var containerWidth = this.$element.width();
			if (totalWidth > containerWidth) {

				// set the position so that the last step is on the right
				var newMargin = totalWidth - containerWidth;
				this.$steps.first().attr('style','margin-left: -' + newMargin + 'px');

				// set the position so that the active step is in a good
				// position if it has been moved out of view
				if (this.$steps.children('.active').first().position().left < 200) {
					newMargin += this.$element.find('li.active').first().position().left - 200;
					if (newMargin < 1) {
						this.$steps.first().attr('style','margin-left: 0');
					} else {
						this.$steps.first().attr('style','margin-left: -' + newMargin + 'px');
					}
				}
			}

			this.$element.trigger('changed');
		},

		stepclicked: function (e) {
			var item        = $(e.currentTarget);
			var index       = this.$steps.children().index(item);
			var canMovePrev = true;

			if( this.options.disablePreviousStep ) {
				if( index < this.currentStep ) {
					canMovePrev = false;
				}
			}

			if( canMovePrev ) {
				var evt = $.Event('stepclick');
				this.$element.trigger(evt, {step: index + 1});
				if (evt.isDefaultPrevented()) return;

				this.currentStep = (index + 1);
				this.setState();
			}
		},

		previous: function (ev) {
			ev.preventDefault();
			var canMovePrev = (this.currentStep > 1);
			if( this.options.disablePreviousStep ) {
				canMovePrev = false;
			}
			if (canMovePrev) {
				var e = $.Event('change');
				this.$element.trigger(e, {step: this.currentStep, direction: 'previous'});
				if (e.isDefaultPrevented()) return;

				this.currentStep -= 1;
				this.setState();
			}
		},

		next: function (ev) {
			ev.preventDefault();
			var canMoveNext = (this.currentStep + 1 <= this.numSteps);
			var lastStep = (this.currentStep === this.numSteps);

			if (canMoveNext) {
				var e = $.Event('change');
				this.$element.trigger(e, {step: this.currentStep, direction: 'next'});

				if (e.isDefaultPrevented()) return;

				this.currentStep += 1;
				this.setState();
			}
			else if (lastStep) {
				this.$element.trigger('finished');

				if (this.$element.is('form')) {
					this.$element.submit();
				}
			}
		},

		selectedItem: function (selectedItem) {
			var retVal, step;

			if(selectedItem) {

				step = selectedItem.step || -1;

				if(step >= 1 && step <= this.numSteps) {
					this.currentStep = step;
					this.setState();
				}

				retVal = this;
			}
			else {
				retVal = { step: this.currentStep };
			}

			return retVal;
		}
	}


	// WIZARD PLUGIN DEFINITION
	// ========================

	var old = $.fn.wizard;

	$.fn.wizard = function (option) {
		var args = Array.prototype.slice.call( arguments, 1 );
		var methodReturn;

		var $set = this.each(function () {
			var $this   = $(this);
			var data    = $this.data('wizard');
			var options = $.extend({}, Wizard.DEFAULTS, $this.data(), typeof option == 'object' && option)

			if(!data) $this.data('wizard', (data = new Wizard(this, options)));
			if(typeof option === 'string') methodReturn = data[option].apply(data, args);
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	}

	$.fn.wizard.Constructor = Wizard;


	// WIZARD NO CONFLICT
	// ==================

	$.fn.wizard.noConflict = function () {
		$.fn.wizard = old;
		return this;
	}


	// WIZARD DATA-API
	// ===============

	$(document).on('mouseover.wizard.data-api', '.wizard', function () {
		var $this = $(this);
		if ($this.data('wizard')) return;
		$this.wizard($this.data());
	});

}(jQuery);