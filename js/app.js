var AppView = Backbone.View.extend({

	el: '#container',

	events: {
		'change #results': 'changeResults'
	},

	// sides is array of labels
	initialize: function(sides) {
		this.sides = sides;
		this.recorder = new Recorder(this.sides);
		this.listenTo(this.recorder.questionaire, 'complete', this.questionaireComplete);
		this.results = [];
		this.$results = $('#results');

		this.render();
	},

	render: function() {
		this.$results.val( this.results.join(', ') );
	},

	questionaireComplete: function() {
		this.results.push(this.recorder.questionaire.questions.at(0).get('answer'));

		this.resultsUpdated();
		this.render();
	},

	resultsUpdated: function() {
		var weights = {};
		for (var i = 0; i < this.sides.length; i++) {
			weights[this.sides[i]] = 1;
		}
		var data = {
			observations: this.results,
			weights: weights,
		};

	  AppView.debug(data.observations.length, JSON.stringify(MathEx.chiTest(data)));
	},

	changeResults: function() {
		this.results = _.reject(
			this.$results.val().split(/\W+/),
			function(v) { return v === ""; }
		);
		this.resultsUpdated();
	}
});

AppView.debug = function() {
	$('#debug').
		prepend(Array.prototype.join.call(arguments, ' ') + '\n');
};

var Recorder = Backbone.View.extend({
	el: '#questionaire',

	events: {
		'click button': 'clickButton'
	},

	initialize: function(sides) {
		this.sides = sides;
		this.questionaire = new Questionaire({ sides: this.sides });
		this.questionaireState = new QuestionaireState();

		this.resetQuestionaire();

		this.listenTo(this.questionaire, 'change', this.questionaireChange);
		this.listenTo(this.questionaireState, 'change', this.questionaireStateChange);

		this.render();
	},

	resetQuestionaire: function() {
		var defaultQuestionaireData = {
			questions: [
				{
					kind: 'regular',
					sides: this.sides
				}
			]
		};
		this.questionaire.parse(defaultQuestionaireData);
	},

	render: function() {
		// just assume some things
		var $question = this.$('#question');
		$question.empty();
		var question = this.currentQuestion();

		var allowedResponses = question.allowedResponses();

		for(var i = 0; i < allowedResponses.length; i++) {
			var button = $('<button>').
				text(allowedResponses[i]).
				attr('data-value', allowedResponses[i]);
			$question.append(button);
		}
	},

	currentQuestion: function() {
		return this.questionaire.questions.at(this.questionaireState.get('activeQuestion'));
	},

	clickButton: function(e) {
		var button = $(e.currentTarget);
		var value = button.data('value');

		var question = this.currentQuestion();
		question.set('answer', value);
	},

	questionaireChange: function() {
		// assume any change to a question indicates the question is complete
		this.questionaireState.nextQuestion();
	},

	questionaireStateChange: function() {
		var totalQuestions = this.questionaire.questions.length;
		if(this.questionaireState.get('activeQuestion') >= totalQuestions) {
			// advance to the next questionaire
			// since we are in a change event handler for this element, we shouldn't cause a second event by changing here
			this.questionaireState.set('activeQuestion', 0);
			this.questionaire.trigger('complete');
			this.resetQuestionaire();
		}

		this.render();
	}
});

var Questionaire = Backbone.Model.extend({
	defaults: {
	},
	constructor: function(attributes, options) {
		this.questions =  new QuestionCollection();

		this.listenTo(this.questions, 'change', this.questionsChange);

		if(!options) options = {};
		options.parse = true;

		Backbone.Model.call(this, attributes, options);
	},
	parse: function(data, options) {
		this.questions.reset(data.questions);

		data = _.extend({}, data);
		delete data.questions;

		return data;
	},
	questionsChange: function() {
		// forward change events on questions collection to ourself
		this.trigger('change', arguments);
	}
});

var QuestionaireState = Backbone.Model.extend({
	defaults: {
		activeQuestion: 0
	},
	nextQuestion: function() {
		this.set('activeQuestion', this.get('activeQuestion') + 1);
	}
});

var QuestionCollection = Backbone.Collection.extend({
	model: function(attrs, options) {
		if(attrs.kind && attrs.sides) {
			return new DiceRollQuestion(attrs, options);
		}
		return new Question(attrs, options);
	}
});

var Question = Backbone.Model.extend({
	defaults: {
		answer: null
	},

	allowedResponses: function() {
		return [];
	}
});

var DiceRollQuestion = Question.extend({
	defaults: {
		kind: 'regular',
		sides: [1,2,3,4,5,6]
	},

	allowedResponses: function() {
		var sides = this.get('sides');
		var kind = this.get('kind');
		if(sides < 2 || kind != 'regular') {
			return Question.prototype.allowedResponses.apply(this, arguments);
		}

		return sides.slice(0);
	}
});

