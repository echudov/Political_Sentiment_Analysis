

(function ($) {
  

  //Implement only for these two content types
  

    // TODO should be handled by View
    Drupal.behaviors.allsidesRemoveTaxonomyDuplicated = {
      attach: function(context, settings) {
        var $topics = $('div.view-explore-other-topics, div.view-explore-topics').find('span.field-content');
        $topics.find('a').each(function(index, element){
          if ($topics.find('a[href="' + $(element).attr('href') + '"]').length > 1) {
            $(element).remove();
          }
        });
      }
    },

    Drupal.behaviors.allsidesSpinner = {
      attach: function(context, settings) {
        $('.overlay-node form:first, .node-edit-overlay form:first').submit(function(){
          $(this).append('<img id="ajax-loader" src="/sites/all/themes/allsides/images/ajax-loader.gif">');
            // TODO this line will disable 'op' value. Needed to figure out the other way
            // .find('input:submit').attr('disabled', 'disabled');
          return true;
        });
      }
    },

    Drupal.behaviors.allsidesIssue = 
    {
    	addingOpinionCollection: false,
      initialized: false,
    	overlay: null,
    	
      attach: function (context, settings) {
        if (this.initialized) {
          return;
        }
        this.initialized = true;
      	this.populateAlternativeOpinionLabels(settings);
      	this.updateOpinionsView();
        this.addSuggestAlternativeButton();
        this.addAddArgumentButton();
      	this.createExpandCollapseContent();
      	this.updateCollapsibleArguments(); 
      	this.hideCurrentTaxonomy();
      	this.updateEditIssueForm();
      	this.updateEditOpinionForm();
      	this.updateSuggestArgumentForm();
      	this.validateIssueRevisionLog();
      	
        this.setOverlay('div.opinion-title-edit a, div.argument-edit a, a.add-argument-anchor, #edit-node-link a, a.suggest-alternative');
      },
      
      _createOverlay: function() {
      	if(this.overlay==null) {
      		this.overlay = new ArgumentOverlay();
      	}    	
      	return this.overlay;
      },

      setOverlay: function(selector) {
        var $selected = $.type(selector) === 'string' ? $(selector) : selector;
        var overlay = this._createOverlay();

        $selected.click(function(event){
          event.preventDefault();

          if ($("body").hasClass("not-logged-in")) { // Redirect Visitors to Registration  
            overlay.setContent('<iframe src="../user/register?render=overlay&destination=/close_overlay" frameborder="0" class="registration-frame" scrollbars="no"></iframe>');
          } else {
            overlay.setContent('<iframe src="'+$(this).attr('href')+'&destination=/close_overlay" frameborder="0" class="edit-node-frame" scrollbars="no"></iframe>');
          }
          overlay.show();
          return false;
        });
      },
      

      /**
       * Automatically populate first & second opinion titles with pre-defined one.
       */
      populateAlternativeOpinionLabels: function(settings) {
          var admin = typeof settings.admin_menu != 'undefined' && typeof settings.admin_menu.destination != 'undefined' ;
          var citizen = typeof settings.allsidesissue != 'undefined' && settings.allsidesissue.id == "yes_no_issue_node_form";

          if(!admin && !citizen)
          	return;
          
          var yes_no_node = admin ? settings.admin_menu.destination.match('node/add/yes-no-issue') : settings.allsidesissue.id == "yes_no_issue_node_form";
          
      	if(yes_no_node || this.addingOpinionCollection) {
      		var titles = [
      		      'Yes, because...', // title of first item
      		      'No, because...',  // title of second item
      		      'Alternative'      // prefix for alternative opinion
      		    ];
      		    
  			$('.field-name-field-opinion-title').find('input').attr('readonly', true).each(function(index,val){
  				if(index>1) {
  				  var ndx = index-1;
  				  $(this).val(titles[2]+' '+ndx+'...');
  				}
  				else {
  				  $(this).val(titles[index]);
  				}
  			});
  				
  			if($('.field-name-field-opinion-title').find('input').length<2) {
  				$('#edit-field-opinion-collection-alts-und-add-more').mousedown();
  				this.addingOpinionCollection = true;
  			}
  			
  			$('.page-node-add-yes-no-issue .field-name-field-opinion-description').each(function(index){
  			  if(index<2) {
  			    $(this).hide();
  			  }
  			});
  		
  		}
      },

      addAddArgumentButton: function() {
        var $element = $('div.opinion-alts div.col-0');
        var nid = $element.data('nid');

        $('div.field-name-field-opinion-collection-alts > div.field-items div.field-item[class*="opinion-item-"] > div.field-collection-view').each(function(index, element){
          var $element = $(element);
          var itemId = $element.find('div.field-name-field-opinion-title div.field-item').data('itemid');
          $element.append($('<a/>')
            .addClass('add-argument-anchor')
            .attr('href', '/node/add/suggested-argument?render=overlay&destination=/close_overlay&issue_id=' + nid + '&alt_id=' + itemId)
            .append($('<span/>')
              .addClass('edit add-argument')
              .text('add')));
        });
      },

      addSuggestAlternativeButton: function() {
        if ($('article.node-yes-no-issue').length > 0) {
          var $element = $('div.opinion-alts div.col-0');
          var nid = $element.data('nid');
          $element.append($('<ul/>')
            .addClass('suggest-alternative-area action-links action-links-field-collection-add')
            .append($('<li/>').append($('<a/>')
                .attr('href', '/field-collection/field-opinion-collection-alts/add/node/' + nid + '?render=overlay')
                .addClass('btn btn-primary suggest-alternative')
                .text('+ suggest an alternative')
                )));
        }
      },
      
      /**
       * Rearrange alternative opinion blocks
       */
      updateOpinionsView: function() {
      	var col1 = $('.opinion-alts .col-0').eq(0), 
      	    col2 = $('.opinion-alts .col-1').eq(0),
      	    col1_height=0, 
      	    col2_height=0;
      	
      	if(col1.length<0 || col2.length<0)
      		return;
      	
      	// rearrange opinion divs
      	$('.opinion-alts  .col-x > .field-item').each(function(index){
      		var div = $(this);
      		var h = div.height();
      		
      		div.addClass('opinion-item-'+index);
      		
      		if(col1_height<=col2_height) {
      			col1.append(div);
      			col1_height += h;
      		}
      		else {
      			col2.append(div);
      			col2_height += h;
      		}
      	});
      	
      	// remove temporary div.
      	$('.opinion-alts  .col-x').remove();
      	
      	// add more link
      	var link = $('.opinion-alts > .field-collection-container > ul.action-links-field-collection-add').eq(0);
      	if(link.length>0) {
      		col1.append(link);
      	}
      },
      
      /**
       * Enable expand/collapse feature for opinion arguments.
       */
      updateCollapsibleArguments: function() {
      	var $cls = $('.field-name-field-argument-title');
      	
      	$cls.each(function(){
      		$(this).addClass('collapsed');
      	});
      	
      	$cls.bind('click',function(){
      		var self = $(this);
      		
      		if(self.hasClass('collapsed')) {
      			self.removeClass('collapsed').addClass('expanded');    		
      		}
      		else {
      			self.removeClass('expanded').addClass('collapsed'); 
      		}    		
      		$(this).parent().find('legend a').trigger('click');
      		return false;
      	});
      	
      	this.createArgumentPopup();
      },
      
      /**
       * Adds "see more/less" links to the main content.
       */
      

      createExpandCollapseContent: function() {
      	

        if ( $('body').hasClass('node-type-yes-no-issue') || $('body').hasClass('node-type-head-to-head-issues') ) {
        	var $el = $('.view-mode-full .field-name-body .field-item');
        	
        	if(!$el.length || $('.view-issue-stances').length>0)
        		return;
        	
        	var isStanceEnabled = $('.candidate-stands').length>0;
        	
        	$el.expander({
            slicePoint:         490,            // default is 100			
            expandPrefix:       ' ...',         // default is '... '
            expandText:         'see more',     // default is 'read more'
            expandEffect:       'slideDown',
            //expandSpeed:        1000,
            userCollapsePrefix: ' ',
            userCollapseText:   'see less',     // default is 'read less'
            collapseEffect:     'slideUp',
            //collapseSpeed:      1000,
            collapseTimer:      0,               // re-collapses after 5 seconds; default is 0, so no re-collapsing
            afterExpand:        function() {
              if($('#edit-node-link').length>0) {
                $el.find('span.details').css("display","inline");
              }			    
            }
          });    
          
          if(isStanceEnabled) {
            this.activateCandidateStancePopup($el);
          }
          
          this.addEditIssueLink($el.eq(0));
        }// end iF
      },

      
      
      
      /**
       * Appends edit button to the end of issue summary.
       */
      addEditIssueLink: function($el) {
        var $editLink = $('#edit-node-link');
        if($editLink.length<1)
           return;

        var overlay = this._createOverlay();

        $el.append($editLink);
        $editLink.css('display','inline-block');
         
        this.addEditAdvocacyGroupLink();
      },
      
      addEditAdvocacyGroupLink: function() {
        var $editLink = $('#edit-node-link'),
            $grpBlock = $('#block-views-advocacy-groups-block');

        if($editLink.length<1 || $grpBlock.length<1)
          return;
      
        var url = $editLink.find('a').eq(0).attr('href');
        
        $grpBlock.prepend('<span class="edit-box"><a href="'+url+'&field=advocacy_groups">edit</a></span>');
      	
        this.setOverlay($grpBlock.find('.edit-box > a'));
      },
      
      
      /**
       * Create argument popup.
       */
      createArgumentPopup: function() {
      	var $el = $('.opinion-alts .field-name-field-argument-body .field-item');
      	
      	if(!$el.length)
      		return;
      	
      	$el.expander({
          slicePoint:         300,            // default is 100			
          expandPrefix:       '...',         // default is '... '
          expandText:         'see more.',     // default is 'read more'
          expandEffect:       'slideDown',
          //expandSpeed:        1000,
          userCollapsePrefix: ' ',
          userCollapseText:   'see less',     // default is 'read less'
          collapseEffect:     'slideUp',
          //collapseSpeed:      1000,
          collapseTimer:      0               // re-collapses after 5 seconds; default is 0, so no re-collapsing
        }); 
  		
        // remove see less link.
        $el.find('.read-less').remove();
  		
        var overlay = this._createOverlay();
        var self = this;
  		
        // override expand event
      	$el.find('.read-more a').unbind('click.expander').bind('click.expander', function(){
      		if(overlay.loading) return false;
      		overlay.loading = true;
      		
      		// find parent of an argument details.
          var ctr=0, o = $(this).parent();
          while(!o.hasClass('summary') && ctr++<10) {
            o = o.parent();
          }
  			
          if(o.hasClass('summary')) {
            var $detail = o.parent().find('.details').eq(0);
            
            // find argument title
            var argTitle = '', opiniontitle = '';
            var itemRoot = o.parent().parent().parent().parent().parent().parent();
            if(itemRoot.hasClass('content')) {
              argTitle = itemRoot.find('.field-name-field-argument-title .field-item').html();
              
              // find opinion title
              ctr = 0;
              var root = itemRoot.parent();
              while(!root.hasClass('field-collection-container') && ctr++<30) {
                root = root.parent();
              }
              
              if(root.hasClass('field-collection-container')) {
                opiniontitle = root.parent().find('.field-name-field-opinion-title .field-item').eq(0).html();						
              }
              
            }
            
            
            var html = '<div class="arg-details"><div class="title">'+$('#page-title').html()+'</div>';
            html += '<div class="opinion-title">'+opiniontitle+'</div>';
            html += '<div class="argument-title">'+argTitle+'</div>';
            html += '<div class="argument-body">'+$detail.html()+'</div>';
            html += '</div>';
            
            overlay.setContent(html);
            
            self.setOverlay(overlay.object.find('.argument-edit > a'));
            overlay.show();
            
          }
          return false;
        });
      },
      
      activateCandidateStancePopup: function($el) {
      	if($('.node-yes-no-issue.view-mode-full').length < 1 && $('.node-head-to-head-issues.view-mode-full').length < 1 )
      		return;
      	
      	// TO DO : get issue ID
      	//var issueId = $('article').attr('class').toString().replace(/[^0-9]/g,'');
      	$el.css('position','relative').prepend($('.candidate-stands'))

      	var words = $('#page-title').html().split(' ');
      	var lastword = words.pop();
      	var title = words.join(' ') + '<img src="/images/spacer.gif" class="page-title-gap"/> ' + lastword; 
      	$('#page-title').html(title);
      	
      	var overlay = this._createOverlay();
      	$('.candidate-stands a').bind('click',function(){
      		if(!overlay.loading) {
  				overlay.loadContent($(this).attr('href') + ' #issue-stances-content', function(){
  					overlay.show({
  						limitHeight: true,
  						container: {
  							root : '#issue-stances-content',
  							div : '.issue-stances-list'
  						}
  					});
  				   
  				});  
      		}    		
      		return false;
      	});
      },
      
      /**
       * Hides current taxonomy from other topics.
       */
      hideCurrentTaxonomy: function() {
      	var url = $('#page').attr('rel');
      	if(url != "") {
      		$('#block-views-explore-other-topics-block').find('a[href='+url+']').hide();
      	}
      },
      
      updateEditIssueForm: function() {
        if($('.issue-node-edit').length<1)
        	  return;
        
        if($('body').hasClass('node-edit-overlay') && !$('html').hasClass('overlay')) {
          $('html').addClass('overlay');
        }
        
       // create a wrapper around the argument div.
        $('.field-name-field-argument-collection .form-item >  table.field-multiple-table').find('tr > td:nth-child(2)').each(function(){
        	if(!$(this).children(':first').hasClass('field-argument-wrapper')) {
            $(this).wrapInner('<div class="field-argument-wrapper"/>');
          }
        });
        
        // update button labels
        $('#edit-field-opinion-collection-alts input.field-add-more-submit.form-submit').val('add argument');
        $('input[name=field_opinion_collection_alts_add_more]').val('add an Alternative Opinion');
        $('.field-argument-wrapper').find('input[value=Remove]').val('delete');
          
        if($('.beta-note').length<1) {
          $('#edit-submit').val('Submit');
          $('#edit-actions').append('<span class="beta-note">During Beta, new issues are submitted for consideration by a moderator.</span>');
        }
        
        
        // add btn class to all buttons
        $('input.form-submit').each(function(){
          if(!$(this).hasClass('btn')) {
            $(this).addClass('btn');
          }
        });
        
        if($('#suggestUserPicture').length>0) {
          $('.vertical-tabs').append($('#suggestUserPicture'));
          $('#suggestUserPicture').show();
        }
        
        $('#edit-field-opinion-collection-alts').show();
      },
      
      updateEditOpinionForm: function() {
        if(!$('body').hasClass('page-field-collection-field-opinion-collection-alts')) 
        	  return;
        
        $('#edit-submit').val('Save');
        
        // update alternative title
        if($('#node-main').hasClass('yes_no_issue') && $('.field-name-field-opinion-title').length>0) {
        	 $('.field-name-field-opinion-title').find('input[type=text]').val($('#opinionTitle').text());
        	 $('.field-name-field-opinion-title').find('input[type=text]').attr('readonly',true);
        }
      },
      
      updateSuggestArgumentForm: function() {
      	if($('#suggested-argument-node-form').length<1 || $('.hidden-inputs').length<1)
      		return;
      	$('.hidden-inputs').find('input').attr('readonly',true);
      	$('#edit-body').find('fieldset').remove();
      
      },
      
      validateIssueRevisionLog: function() {
      	var $log = $('#edit-log');
      	
      	$log.bind('keyup',function(){
      		if($(this).val().length>0) {
      			$(this).removeClass('error');
      		}
      	})
      	.bind('focus',function(){
      		if($(this).hasClass('error')) {
      			$(this).val('');
      		}
      	})
      	.bind('blur', function(){
      		if($(this).hasClass('error')) {
      			$(this).val('Briefly describe your changes...');
      		}
      	});
      	
      	$('#edit-submit').bind('click',function(){
      		if($log.length>0 && $log.is(':visible')) {
      			console.log('xx');
      			if($log.val()=='' || $log.hasClass('error')) {
      				$log.addClass('error');
  					$log.trigger('blur');
  					return false;
      			}
      		}
      		
      		return true;
      	});
      }
    };
  
    /**
     * overlay popup for argument
     */
    function ArgumentOverlay() {
    	  var tpl = '<div class="argument-overlay"><div class="overlay-mask"></div><div class="overlay-container"><div class="overlay-content"></div><div style="visibility:hidden">_</div><a href="#" class="overlay-close">close</a></div></div>';
    	  this.object = $(tpl);
    	  this.loading = false;
    	  $('body').append(this.object);
    } 
    
    ArgumentOverlay.prototype.loadContent = function(url, callback) {
    	  this.loading = true;
    	  this.object.find('.overlay-content').eq(0).load(url, function(){
    	      if(callback) callback();
    	  });
    }
    
    ArgumentOverlay.prototype.setContent = function(html) {
    	  this.loading = true;
    	  this.object.find('.edit_link').unbind();
    	  this.object.find('.overlay-content').html(html);
    }
    
    ArgumentOverlay.prototype.show = function(prop) {
    	  var $this = this, o = this.object;
    	  
    	  o.find('a.overlay-close').unbind('click').bind('click',function(){
    	  	$this.hide();
    	  });
    	  
    	  o.css({'visibility':'hidden', 'paddingRight':0, 'paddingLeft' : 10}).show();  	  
    	  o.find('.overlay-mask').height($(window).height());
    	  
    	  if(typeof prop != 'undefined' && typeof prop.limitHeight != 'undefined' && prop.limitHeight && typeof prop.container != 'undefined') {
    	  	  var h = $(prop.container.root).height();
    	  	  var wh =  $(window).height()-300;
    	  	  if(h > wh) {
    	  	  	  $(prop.container.root).find(prop.container.div).height(wh);
    	  	  	  o.find('.overlay-container').css({'paddingRight':0, 'paddingLeft': 10});
    	  	  }
    	  }
    	  
    	  
    	  $(window).bind('resize.overlay',function(){
    	      o.find('.overlay-mask').height($(window).height());
    	  })
    	  
    	  setTimeout(function(){
    	  	  var h = ($(window).height() - o.find('.overlay-container').eq(0).height()-46)/2 - 50;
    	  	  if(h<0) h = 0;
  		  o.css('padding-top', h);		  
  		  o.hide().css('visibility','visible').fadeIn().show();
    	  },10);
    }
    
    ArgumentOverlay.prototype.hide = function() {
    	  $(window).unbind('resize.overlay');
    	  this.object.fadeOut('fast');
    	  this.loading = false;
    }

  
})(jQuery);


function closeArgumentOverlay(html) {
  if (Drupal.behaviors.allsidesIssue.overlay) {
    Drupal.behaviors.allsidesIssue.overlay.hide();

    if (html && html.length > 0) {
      Drupal.behaviors.allsidesIssue.overlay.setContent(html);
      Drupal.behaviors.allsidesIssue.overlay.show();
      setTimeout(function(){
        Drupal.behaviors.allsidesIssue.overlay.hide();
        window.parent.document.location.reload();
      }, 3000);
    } else {
      // must be signin/up
      window.location.reload();
    }
  }
}
;
/**
 * @file
 * Selects all tables and adds responsive class.
 *
 * @todo Make drupal admin page to enter specific table ID's and classes.
 */

(function ($) {
  Drupal.behaviors.zurbResponsive = {
    attach: function (context, settings) {

  $("table").addClass("responsive");

}
  };

})(jQuery);

(function ($) {
  if($('body').hasClass('page-bias-bias-ratings'))
{

}
else
{
 
  var switched = false;
  var updateTables = function() {
    if (($(window).width() < 767) && !switched){
      switched = true;
      $("table.responsive").each(function(i, element) {
        splitTable($(element));
      });
      return true;
    }
    else if (switched && ($(window).width() > 767)) {
      switched = false;
      $("table.responsive").each(function(i, element) {
        unsplitTable($(element));
      });
    }
  };

  jQuery(window).load(updateTables);
  jQuery(window).bind("redraw",function(){switched = false;updateTables();});
  jQuery(window).bind("resize", updateTables);

function splitTable(original)
  {
  original.wrap("<div class='table-wrapper' />");

  var copy = original.clone();
  copy.find("td:not(:first-child), th:not(:first-child)").css("display", "none");
  copy.removeClass("responsive");

  original.closest(".table-wrapper").append(copy);
  copy.wrap("<div class='pinned' />");
  original.wrap("<div class='scrollable' />");

  setCellHeights(original, copy);
  }

  function unsplitTable(original) {
  original.closest(".table-wrapper").find(".pinned").remove();
  original.unwrap();
  original.unwrap();
  }

function setCellHeights(original, copy) {
  var tr = original.find('tr'),
    tr_copy = copy.find('tr'),
    heights = [];

  tr.each(function (index) {
    var self = $(this),
    tx = self.find('th, td');

  tx.each(function () {
    var height = $(this).outerHeight(true);
    heights[index] = heights[index] || 0;
    if (height > heights[index]) {
      heights[index] = height;
    }
    });
  });

  tr_copy.each(function (index) {
    $(this).height(heights[index]);
  });
}
}
})(jQuery);
;
/**
 * @file
 */

(function ($) {

  'use strict';

  Drupal.extlink = Drupal.extlink || {};

  Drupal.extlink.attach = function (context, settings) {
    if (!settings.hasOwnProperty('extlink')) {
      return;
    }

    // Strip the host name down, removing ports, subdomains, or www.
    var pattern = /^(([^\/:]+?\.)*)([^\.:]{1,})((\.[a-z0-9]{1,253})*)(:[0-9]{1,5})?$/;
    var host = window.location.host.replace(pattern, '$2$3');
    var subdomain = window.location.host.replace(host, '');

    // Determine what subdomains are considered internal.
    var subdomains;
    if (settings.extlink.extSubdomains) {
      subdomains = '([^/]*\\.)?';
    }
    else if (subdomain === 'www.' || subdomain === '') {
      subdomains = '(www\\.)?';
    }
    else {
      subdomains = subdomain.replace('.', '\\.');
    }

    // Build regular expressions that define an internal link.
    var internal_link = new RegExp('^https?://([^@]*@)?' + subdomains + host, 'i');

    // Extra internal link matching.
    var extInclude = false;
    if (settings.extlink.extInclude) {
      extInclude = new RegExp(settings.extlink.extInclude.replace(/\\/, '\\'), 'i');
    }

    // Extra external link matching.
    var extExclude = false;
    if (settings.extlink.extExclude) {
      extExclude = new RegExp(settings.extlink.extExclude.replace(/\\/, '\\'), 'i');
    }

    // Extra external link CSS selector exclusion.
    var extCssExclude = false;
    if (settings.extlink.extCssExclude) {
      extCssExclude = settings.extlink.extCssExclude;
    }

    // Extra external link CSS selector explicit.
    var extCssExplicit = false;
    if (settings.extlink.extCssExplicit) {
      extCssExplicit = settings.extlink.extCssExplicit;
    }

    // Define the jQuery method (either 'append' or 'prepend') of placing the icon, defaults to 'append'.
    var extIconPlacement = settings.extlink.extIconPlacement || 'append';

    // Find all links which are NOT internal and begin with http as opposed
    // to ftp://, javascript:, etc. other kinds of links.
    // When operating on the 'this' variable, the host has been appended to
    // all links by the browser, even local ones.
    // In jQuery 1.1 and higher, we'd use a filter method here, but it is not
    // available in jQuery 1.0 (Drupal 5 default).
    var external_links = [];
    var mailto_links = [];
    $('a:not(.' + settings.extlink.extClass + ', .' + settings.extlink.mailtoClass + '), area:not(.' + settings.extlink.extClass + ', .' + settings.extlink.mailtoClass + ')', context).each(function (el) {
      try {
        var url = '';
        if (typeof this.href == 'string') {
          url = this.href.toLowerCase();
        }
        // Handle SVG links (xlink:href).
        else if (typeof this.href == 'object') {
          url = this.href.baseVal;
        }
        if (url.indexOf('http') === 0
          && ((!url.match(internal_link) && !(extExclude && url.match(extExclude))) || (extInclude && url.match(extInclude)))
          && !(extCssExclude && $(this).is(extCssExclude))
          && !(extCssExclude && $(this).parents(extCssExclude).length > 0)
          && !(extCssExplicit && $(this).parents(extCssExplicit).length < 1)) {
          external_links.push(this);
        }
        // Do not include area tags with begin with mailto: (this prohibits
        // icons from being added to image-maps).
        else if (this.tagName !== 'AREA'
          && url.indexOf('mailto:') === 0
          && !(extCssExclude && $(this).parents(extCssExclude).length > 0)
          && !(extCssExplicit && $(this).parents(extCssExplicit).length < 1)) {
          mailto_links.push(this);
        }
      }
      // IE7 throws errors often when dealing with irregular links, such as:
      // <a href="node/10"></a> Empty tags.
      // <a href="http://user:pass@example.com">example</a> User:pass syntax.
      catch (error) {
        return false;
      }
    });

    if (settings.extlink.extClass) {
      Drupal.extlink.applyClassAndSpan(external_links, settings.extlink.extClass, extIconPlacement);
    }

    if (settings.extlink.mailtoClass) {
      Drupal.extlink.applyClassAndSpan(mailto_links, settings.extlink.mailtoClass, extIconPlacement);
    }

    if (settings.extlink.extTarget) {
      // Apply the target attribute to all links.
      $(external_links).attr('target', settings.extlink.extTarget);
      // Add rel attributes noopener and noreferrer.
      $(external_links).attr('rel', function (i, val) {
        // If no rel attribute is present, create one with the values noopener and noreferrer.
        if (val == null) {
          return 'noopener noreferrer';
        }
        // Check to see if rel contains noopener or noreferrer. Add what doesn't exist.
        if (val.indexOf('noopener') > -1 || val.indexOf('noreferrer') > -1) {
          if (val.indexOf('noopener') === -1) {
            return val + ' noopener';
          }
          if (val.indexOf('noreferrer') === -1) {
            return val + ' noreferrer';
          }
          // Both noopener and noreferrer exist. Nothing needs to be added.
          else {
            return val;
          }
        }
        // Else, append noopener and noreferrer to val.
        else {
          return val + ' noopener noreferrer';
        }
      });
    }

    Drupal.extlink = Drupal.extlink || {};

    // Set up default click function for the external links popup. This should be
    // overridden by modules wanting to alter the popup.
    Drupal.extlink.popupClickHandler = Drupal.extlink.popupClickHandler || function () {
      if (settings.extlink.extAlert) {
        return confirm(settings.extlink.extAlertText);
      }
    };

    $(external_links).click(function (e) {
      return Drupal.extlink.popupClickHandler(e, this);
    });
  };

  /**
   * Apply a class and a trailing <span> to all links not containing images.
   *
   * @param {object[]} links
   *   An array of DOM elements representing the links.
   * @param {string} class_name
   *   The class to apply to the links.
   * @param {string} icon_placement
   *   'append' or 'prepend' the icon to the link.
   */
  Drupal.extlink.applyClassAndSpan = function (links, class_name, icon_placement) {
    var $links_to_process;
    if (Drupal.settings.extlink.extImgClass) {
      $links_to_process = $(links);
    }
    else {
      var links_with_images = $(links).find('img').parents('a');
      $links_to_process = $(links).not(links_with_images);
    }
    $links_to_process.addClass(class_name);
    var i;
    var length = $links_to_process.length;
    for (i = 0; i < length; i++) {
      var $link = $($links_to_process[i]);
      if ($link.css('display') === 'inline' || $link.css('display') === 'inline-block') {
        if (class_name === Drupal.settings.extlink.mailtoClass) {
          $link[icon_placement]('<span class="' + class_name + '" aria-label="' + Drupal.settings.extlink.mailtoLabel + '"></span>');
        }
        else {
          $link[icon_placement]('<span class="' + class_name + '" aria-label="' + Drupal.settings.extlink.extLabel + '"></span>');
        }
      }
    }
  };

  Drupal.behaviors.extlink = Drupal.behaviors.extlink || {};
  Drupal.behaviors.extlink.attach = function (context, settings) {
    // Backwards compatibility, for the benefit of modules overriding extlink
    // functionality by defining an "extlinkAttach" global function.
    if (typeof extlinkAttach === 'function') {
      extlinkAttach(context);
    }
    else {
      Drupal.extlink.attach(context, settings);
    }
  };

})(jQuery);
;
