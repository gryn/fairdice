
customMatchers = {
	toApproximate: function(util, cet) { return {
		// threshold is always treated as a percentage,
		// if not passed, it defaults to 0.1%;
		compare: function(actual, expected, threshold) {
			if(threshold == null) threshold = 0.001;
			threshold *= Math.abs(actual);

			var pass;
			if(actual == Infinity || expected == Infinity) {
				pass = actual == expected;
			} else {
				pass = Math.abs(actual - expected) <= threshold;
			}
			
			return { pass: pass };
		}
	};}
};

describe('custom matchers', function() {
	beforeEach(function() {
		jasmine.addMatchers(customMatchers);
	});

	it('toApproximate allows a small difference', function() {
		expect(2.9991).toApproximate(3);
	});

	it('toApproximate allows a larger difference', function() {
		expect(2.1).toApproximate(3, 1);
	});
});

describe('MathEx functions', function() {
	beforeEach(function() {
		jasmine.addMatchers(customMatchers);
	});
	
	var gammaSmallTests = [
		[0.0, Infinity],
		[0.1, 9.51351],
		[0.2, 4.59084],
		[0.3, 2.99157],
		[0.4, 2.21816],
		[0.5, 1.77245],
		[0.6, 1.48919],
		[0.7, 1.29806],
		[0.8, 1.16423],
		[0.9, 1.06863],
		[1.0, 1.00000],
		[1.1, 0.95135],
		[1.2, 0.91817],
		[1.3, 0.89747],
		[1.4, 0.88726],
		[1.5, 0.88623],
		[1.6, 0.89352],
		[1.7, 0.90864],
		[1.8, 0.93138],
		[1.9, 0.96178],
		[2.0, 1.00000]
	];
	
	var gammaLargeTests = [
		[10, 362880],
		[20, 121645100408832000],
		[30, 8841761993739701954543616000000],
		[40, 20397882081197443358640281739902897356800000000],
		[50, 608281864034267560872252163321295376887552831379210240000000000],
		[60, 138683118545689835737939019720389406345902876772687432540821294940160000000000000],
		[70, 171122452428141311372468338881272839092270544893520369393648040923257279754140647424000000000000000],
		[80, 894618213078297528685144171539831652069808216779571907213868063227837990693501860533361810841010176000000000000000000],
		[90, 16507955160908461081216919262453619309839666236496541854913520707833171034378509739399912570787600662729080382999756800000000000000000000],
		[100, 933262154439441526816992388562667004907159682643816214685929638952175999932299156089414639761565182862536979208272237582511852109168640000000000000000000000]
	];

	it('gamma computes small values well', function() {
		for(var i = 0; i < gammaSmallTests.length; i++) {
		  var test = gammaSmallTests[i];
	    expect(MathEx.gamma(test[0])).toApproximate(test[1], 0.0001);
		}
	});

	it('gamma computes large values well', function() {
		for(var i = 0; i < gammaLargeTests.length; i++) {
		  var test = gammaLargeTests[i];
	    expect(MathEx.gamma(test[0])).toApproximate(test[1], 0.00001);
		}
	});
	
	var chi2pdfTests = [
		[1, 1, 0.2420],
		[2, 2, 0.1839],
		[3, 3, 0.1542],
		[4, 4, 0.1353],
		[5, 5, 0.1220],
		[6, 6, 0.1120]
	];

	it('chi2pdf computes values well', function() {
		for(var i = 0; i < chi2pdfTests.length; i++) {
		  var test = chi2pdfTests[i];
	    expect(MathEx.chi2PDF(test[0], test[1])).toApproximate(test[2]);
		}
	});

	var chi2cdfTests = [
		[1, 1, 0.6827],
		[2, 2, 0.6321],
		[3, 3, 0.6084],
		[4, 4, 0.5940],
		[5, 5, 0.5841],
		[0.016, 1, 0.100],
		[0.211, 2, 0.100],
		[0.584, 3, 0.100],
		[1.064, 4, 0.100],
		[2.706, 1, 0.900],
		[4.606, 2, 0.900],
		[6.251, 3, 0.900],
		[7.779, 4, 0.900],
		[0.412, 5, 0.005],
		[0.554, 5, 0.010],
		[0.831, 5, 0.025],
		[1.145, 5, 0.050],
		[1.610, 5, 0.100],
		[9.236, 5, 0.900],
		[11.070, 5, 0.950],
		[12.833, 5, 0.975],
		[15.086, 5, 0.990],
		[16.750, 5, 0.995]
	];

	it('chi2cdf computes values well', function() {
		for(var i = 0; i < chi2cdfTests.length; i++) {
		  var test = chi2cdfTests[i];
	    expect(MathEx.chi2CDF(test[0], test[1])).toApproximate(test[2], 0.01);
		}
	});

	var trapezoidIntegrateTests = [
		[0, 1, -0.16667],
		[0, 2,  0.66667],
		[1, 3,  4.66667],
		[2, 4, 12.66667],
		[3, 5, 24.66667]
	];
	var trapezoidTestFunc = function(x) { return x * x - x; };

	it('trapezoidIntegrate computes values well', function() {
		for(var i = 0; i < trapezoidIntegrateTests.length; i++) {
		  var test = trapezoidIntegrateTests[i];
	    expect(MathEx.trapezoidIntegrate(test[0], test[1], trapezoidTestFunc)).toApproximate(test[2], 0.01);
		}
	});

	// createObservations
	// arguments: 'a', 3, 'b', 2
	// result: ['a', 'a', 'a', 'b', 'b']
	function createObservations() {
		var result = [];
		
		function createRun(v, n) {
			return Array(n + 1).join().split('').map(function(){ return v; });
		}
		
		for(var i = 0; i + 1 < arguments.length; i += 2) {
			var v = arguments[i];
			var n = arguments[i+1];
			result.push.apply(result, createRun(v, n));
		}
		return result;
	}

	var computeChiSquareTests = [
		[ {
				observations: createObservations('a', 4, 'b', 4, 'c', 12, 'd', 0, 'e', 9, 'f', 19),
				weights: { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 }
			},
			29.25	],
		[ {
				observations: createObservations('a', 4),
				weights: { a: 1 }
			},
			0	],
		[ {
				observations: createObservations(),
				weights: { a: 1 }
			},
			0	]
	];

	it('computeChiSquare computes values well', function() {
		for(var i = 0; i < computeChiSquareTests.length; i++) {
		  var test = computeChiSquareTests[i];
	    expect(MathEx.computeChiSquare(test[0]).chiSquare).toEqual(test[1]);
		}
	});

	var chiTestTests = [
		[ {
				observations: createObservations('a', 8, 'b', 8, 'c', 8, 'd', 8, 'e', 7, 'f', 9),
				weights: { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 }
			},
			0.99847918 ],
		[ {
				observations: createObservations('a', 8, 'b', 8, 'c', 8, 'd', 8, 'e', 4, 'f', 12),
				weights: { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 }
			},
			0.54941595 ],
		[ {
				observations: createObservations('a', 8, 'b', 8, 'c', 8, 'd', 8, 'e', 0, 'f', 16),
				weights: { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 }
			},
			0.00684407 ],
		[ {
				observations: createObservations('a', 4, 'b', 8),
				weights: { a: 1, b: 1 }
			},
			0.24821308 ],
		[ {
				observations: createObservations('a', 4, 'b', 8, 'c', 6),
				weights: { a: 1, b: 1, c: 1 }
			},
			0.51341712 ],
		[ {
				observations: [
					2, 9, 5, 10, 4, 6, 1, 9, 6, 4,
					4, 4, 9, 10, 2, 6, 7, 6, 10, 8,
					1, 10, 8, 5, 4, 3, 6, 3, 2, 6,
					2, 1, 1, 1, 6, 5, 10, 10, 2, 5,
					5, 7, 9, 6, 6, 2, 10, 4, 7, 2,
					9, 7, 5, 10, 9, 3, 2, 1, 6, 1 ],
				weights: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1, '10': 1 }
			},
			0.43727419 ]
	];

	it('chiTest computes values well', function() {
		for(var i = 0; i < chiTestTests.length; i++) {
		  var test = chiTestTests[i];
	    expect(MathEx.chiTest(test[0]).p).toApproximate(test[1], 0.01);
		}
	});
});