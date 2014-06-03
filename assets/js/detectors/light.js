/*
 * Light Detector
 * http://www.happyworm.com
 *
 * Copyright (c) 2014 Happyworm Ltd
 * Licensed under the MIT license.
 * http://opensource.org/licenses/MIT
 *
 * Author: Mark J Panaghiston
 * Version: 0.0.1
 * Date: 3rd June 2014
 *
 * Requires:
 * UserMedia or Face instance for camera input
 */

(function(PM) {

	var DEBUG = false;

	var Light = function(options) {
		this.init(options);
	};

	if(typeof PM === 'undefined') {
		window.Light = Light; // 
	} else {
		PM.Light = function(options) {
			return new Light(options); // 
		};
	}

	Light.prototype = {
		init: function(options) {
			// The default options
			this.options = {
				id: '', // The id of messages being broadcast.
				target: null,
				width: 400,
				height: 300,
				threshold_pixel: 40 // Out of 255
			};
			// Read in instancing options.
			for(var option in options) {
				if(options.hasOwnProperty(option)) {
					this.options[option] = options[option];
				}
			}
			this.target = typeof this.options.target === 'string' ? document.querySelector(this.options.target) : this.options.target;

			this.imageData = null;

			this.initCanvas();
			this.start();
		},
		broadcast: function(type, event) {
			// Broadcast the message
			if(PM) {
				PM.broadcast(type, {
					id: this.options.id,
					target: this,
					event: event,
					msg: 'Generated by: Light'
				});
			}
		},
		initCanvas: function() {
			this.lightCanvas = document.createElement("canvas");
			this.lightCanvas.setAttribute("width", this.options.width);
			this.lightCanvas.setAttribute("height", this.options.height);
			this.lightCanvas.className = 'motion';

			this.lightContext = this.lightCanvas.getContext("2d");
			this.lightContext.font = '20px Arial';
			this.lightContext.textAlign = 'center';
			this.lightContext.textBaseline = 'middle';

			this.target.appendChild(this.lightCanvas);
		},
		start: function() {
			var self = this;

			var measure = function(diff) {
				var fired = 255;
				if(diff > self.options.threshold_pixel) {
					return fired;
				} else if(diff < -self.options.threshold_pixel) {
					return fired;
				} else {
					return 0;
				}
			};

			if(PM) {
				PM.listen('usermedia_update', function(data) {
					var media = data.target;

					self.imageData = data.target.cameraContext.getImageData(0, 0, data.target.options.width, data.target.options.height);
					self.imageSum = {
						red:0,
						green:0,
						blue:0
					};
					for(var i = 0, iLen = self.imageData.data.length; i < iLen; i+=4) {
						self.imageSum.red += self.imageData.data[i];
						self.imageSum.green += self.imageData.data[i+1];
						self.imageSum.blue += self.imageData.data[i+2];
					}
					var factorToRatio = 4 / self.imageData.data.length / 255;
					self.balance = {
						red: self.imageSum.red * factorToRatio,
						green: self.imageSum.green * factorToRatio,
						blue: self.imageSum.blue * factorToRatio
					};
					self.balance.white = (self.balance.red + self.balance.green + self.balance.blue) / 3;

					self.draw(self.balance);

					if(DEBUG) console.log('[usermedia_update] | red: ' + self.balance.red + ' | green: ' + self.balance.green + ' | blue: ' + self.balance.blue + ' | motion: ' + self.motion);
/*
					if(self.balance.white > self.options.threshold) {
						self.broadcast('light_bright');
					}
*/
					self.broadcast('light_update');
				});
			}
		},
		draw: function(balance) {
			var ctx = this.lightContext;
			var xPitch = this.options.width / 3;
			var yPitch = this.options.height / 2;
			if(ctx) {
				// Clear the canvas
				// ctx.clearRect(0, 0, this.options.width, this.options.height);

				// Copy the image to our output
				ctx.putImageData(this.imageData, 0, 0);

				// Set the fill style
				ctx.fillStyle = this.options.color;
				ctx.strokeStyle = this.options.color;

				ctx.fillStyle = 'rgba(255,0,0,' + balance.red + ')';
				ctx.fillRect(0, 0, xPitch, yPitch);
				ctx.fillStyle = 'rgba(0,255,0,' + balance.green + ')';
				ctx.fillRect(xPitch, 0, xPitch, yPitch);
				ctx.fillStyle = 'rgba(0,0,255,' + balance.blue + ')';
				ctx.fillRect(2 * xPitch, 0, xPitch, yPitch);

				ctx.fillStyle = 'rgba(255,255,255,' + balance.white + ')';
				ctx.fillRect(0, yPitch, this.options.width, yPitch);

				ctx.fillStyle = '#fff';

				ctx.fillText((100*balance.red).toFixed(1)+'%', 0.5 * xPitch, 0.5 * yPitch);
				ctx.fillText((100*balance.green).toFixed(1)+'%', 1.5 * xPitch, 0.5 * yPitch);
				ctx.fillText((100*balance.blue).toFixed(1)+'%', 2.5 * xPitch, 0.5 * yPitch);

				ctx.fillText((100*balance.white).toFixed(1)+'%', 0.5 * this.options.width, 1.5 * yPitch);
			}
		},
		stop: function() {
		},
		update: function(event) {
		}
	};
}(window.PM));
