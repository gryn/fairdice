MathEx = {
	constants: {
		sqrt2pi: Math.sqrt(2*Math.PI),
	},
	// gamma function -- approximately (z-1)! but as a continous function
	gamma: function(z) {
		if( z < 0 )
			return;
		if( z === 0 )
			return Infinity;

		// this approximation is poor for small values,
		// so shift up to two times, and reduce down.
		if( z < 2 ) {
			return MathEx.gamma( z + 1 ) / z;
		}

		return MathEx.constants.sqrt2pi * Math.sqrt(1 / z) *
			Math.pow((z + 1 / (12 * z - 0.1 / z)) / Math.E,	z);
	},
	
	// chi probability density function, x -> infinity, result -> 0
	// x: sum(chi square values)
	// k: degrees of  freedom
	chi2PDF: function(x, k) {
		return Math.exp(-x / 2) * Math.pow(x, k / 2 - 1) /
			Math.pow(2, k / 2) / MathEx.gamma(k / 2);
	},
	
	// chi cumulative density function, x -> infinty, result -> 1.0
	// x: sum(chi square values)
	// k: degrees of  freedom
	chi2CDF: function(x, k) {
		if( x <= 0 )
			return 0;

		var startX = 0;
		var area = 0;
		
		// exceptional case: k = 1, we approximate area with a constant,
		// since chiPDF(0, 1) == Infinity
		if(k == 1) {
			if(x >= 0.1) {
				area = 0.25;
				startX = 0.1;
			} else {
				area = 0.08;
				startX = 0.01;
			}
			// NOTE: if x is smaller than 0.01, we will compute an incorrect value.
		}

		// integrate chiPDF from 0 to x
		area += MathEx.trapezoidIntegrate(startX, x, function(x) { return MathEx.chi2PDF(x, k); });
		
		return area;
	},
	
	computeChiSquare: function(data, options) {
		// dataset may be single dimensional currently,
		// weights must be given, which are used to comput expected values
		//	{
		//		observations: [ 'a', 'b', 'c', 'a', 'a', 'b', ... ],
		//		weights: { 'a': 1, 'b': 1, 'c': 2 }
		//	}
		var observations = data.observations && data.observations || [];
		var weights = data.weights || {};
		
		if(!Object.keys(weights).length) {
			throw new Error('invalid argument, weights must be present');
		}

		var totalObservations = observations.length;
		
		var weightSum = _.reduce(weights, function(a, v, k) { return a + v; }, 0);
		var expectedValues = _.mapObject(weights, function(v, k) { return v / weightSum * totalObservations; });
		
		var observationCounts = _.countBy(observations, function(v) { return v; });
		
		// now ensure observations only contains keys we know about in weights
		observationCounts = _.mapObject(weights, function(v, k) {
			return observationCounts[k] || 0;
		});

		var warning;
		var chiSquare = _.reduce(
			observationCounts,
			function(a, v, k) {
				var expectedValue = expectedValues[k];
				if(expectedValue == null && !warning) {
					warning = 'key "' + k + '" is not found in given weights';
					expectedValue = 0;
				}
				
				// skip expectedValues of zero, we warn about them later
				if(!expectedValue) {
					return a;
				}
				
				return a + Math.pow(v - expectedValue, 2) / expectedValue;
			},
			0);
		
		var infrequentExpectedValues = _.filter(expectedValues, function(v, k) { return v < 5; }).length / Object.keys(expectedValues).length;
		if(infrequentExpectedValues >= 0.20) {
			warning = 'expectedValues contains ' + (infrequentExpectedValues * 100) + '% infrequent (below 5) values';
		}
		
		var zeroExpectedValues = _.filter(expectedValues, function(v, k) { return v < 1; }).length;
		if(zeroExpectedValues) {
			warning = 'expectedValues contains ' + zeroExpectedValues + ' values that are near zero';
		}
		
		var result = {
			chiSquare: chiSquare
		};
		
		if(warning) {
			result.warning = warning;
		}
		
		return result;
	},

	// NOTE: only simplest case (single dimension) written
	// perform a chi test, result is the 
	chiTest: function(data, options) {
		// simplest dataset - single dimension, 
		//	{
		//		observations: [ 'a', 'b', 'c', 'a', 'a', 'b', ... ],
		//		name: 'favorite letter', // name of the single dimension
		//		weights: { 'a': 1, 'b': 1, 'c': 2 }
		//	}
		// more complex - multi-dimensional data,
		/* { 
 			observations: [
				{ party: 'dem', age: 50, sex: 'm' },
				{ party: 'rep', age: 40, sex: 'm' },
				{ party: 'dem', age: 20, sex: 'f' },
				...
			],
			// name: is not used here since the dimensions are named explicitly
			weights: {
				party: {
					'dem': 50,
					'rep': 50
				},
				// generate weights using function, along with range
				age: {
					func: function(age) { return Math.min(10, 30 - Math.abs(x - 30)); }
					min: 18,
					max: 100,
					step: 1
				},
				sex: {
					m: 50,
					f: 50
				}
			}
		} */
		
		var observations = data.observations || [];
		var weights = data.weights || {};
		
		if(!Object.keys(weights).length) {
			throw new Error('invalid argument, weights must be present');
		}

		var result = {
			
		};
		
		var degreesOfFreedom = Object.keys(weights).length - 1;
		if(degreesOfFreedom < 1) {
			throw new Error('invalid argument, must specify at least two weights');
		}

		var chiSquareResult = MathEx.computeChiSquare(data);
		
		result.p = 1 - MathEx.chi2CDF(chiSquareResult.chiSquare, degreesOfFreedom);
		result.warning = chiSquareResult.warning;
		
		return result;
	},
	
	trapezoidIntegrate: function(x1, x2, func) {
		var dx = 0.01;
		
		// dynamically assign dx to keep total steps within 1000 to 100000
		var dist = Math.abs(x2 - x1);
		var steps = dist / dx;
		if(steps > 100000) {
			dx = dist / 100000;
		} else if(steps < 1000) {
			dx = dist / 1000;
		}
		
		var i = x1;
		var area = 0;

		var y = func(i);
		while(i + dx < x2) {
			var newY = func(i + dx);
			var trapezoidArea = (y + newY) * dx / 2;
			area += trapezoidArea;
			
			i += dx;
			y = newY;
		}
		
		// note there may be overshoot or undershoot,
		// i.e. i <> x2 at this point.
		// we do not bother to compensate as the computed value is close enough already.

		return area;
	}
};
