const blogSearch = document.createElement("input");
blogSearch.setAttribute("type", "search");
blogSearch.setAttribute("class", "form-control mb-4");
blogSearch.setAttribute("placeholder", "Search");
blogSearch.setAttribute("aria-label", "Search");
blogSearch.setAttribute("onsearch", "doSearch()");

var renderTarget;
var id;
var search;
var filter;

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function setRenderTarget(someElement) {
	renderTarget = someElement;
}

function setId(num) {
	id = num;
}

function setFilter(tag) {
	filter = tag;
}

function setSearch(terms) {
	blogSearch.value = terms;
	search = terms.split(' ');
}

function addFilter(tag) {
	setFilter(tag.toLowerCase());
	if (gtag) {
		gtag("event", "search", {
			search_term: tag
		});
	}
	updateHistory();
	if (renderTarget) {
		renderBlog();
	}
}

function clearFilter() {
	setFilter(null);
	updateHistory();
	if (renderTarget) {
		renderBlog();
	}
}

function doSearch() {
	search = blogSearch.value.split(' ');
	if (!blogSearch.value) {
		search = null;
	} else if (gtag) {
		gtag("event", "search", {
			search_term: blogSearch.value
		});
	}
	updateHistory();
	if (renderTarget) {
		renderBlog();
	}
}

function updateHistory() {
	if (history.pushState) {
		var queries = [];
		if (filter) {
			queries.push("t="+filter.toLowerCase().replace(' ', '+'));
		}
		if (search) {
			queries.push("s="+search.map(function(s) {s = s.toLowerCase(); return s;}).join('+'));
		}
		var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
		if (queries.length > 0) {
			newurl = newurl + "?" + queries.join('&');
		}
		window.history.pushState({path:newurl},'',newurl);
	}
}

function renderBlog() {
	function matchFilter(tag) {
		return tag.toLowerCase() == filter.toLowerCase();
	}
	function matchSearch(article) {
		for (var i = 0; i < search.length; i++) {
			if (!article.search.includes(search[i].toLowerCase())) {
				return false;
			}
		}
		return true;
	}
	renderTarget.innerText = "";
	fetch('./blog/index.json').then(response => {
		return response.json();
	}).then(data => {
		//Handle data
		var articles = data.articles;
		var idFound = false;
		if (id) {
			for (var n = 0; n < articles.length; n++) {
				if (articles[n].id == id) {
					idFound = true;
				}
			}
			if (idFound) {
				fetch('./blog/' + id + '.json').then(innerResponse => {
					return innerResponse.json();
				}).then(innerData => {
					if (gtag) {
						gtag("event", "select_content", {
							content_type: "article",
							item_id: id
						});
					}
					var articleTitle = document.createElement("h1");
					articleTitle.innerText = innerData.title;
					document.title = "David Redl - " + innerData.title;
					renderTarget.appendChild(articleTitle);
					var articleSubTitle = document.createElement("h3");
					articleSubTitle.innerText = innerData.subtitle;
					renderTarget.appendChild(articleSubTitle);
					var description = innerData.title + " - " + innerData.subtitle;
					document.querySelector('meta[name="description"]').remove()
					var metaDescription = document.createElement('meta');
					metaDescription.setAttribute("name", "description");
					metaDescription.setAttribute("content", description);
					document.head.appendChild(metaDescription);
					document.querySelector('meta[property="og:description"]').remove();
					var metaOgDescription = document.createElement('meta');
					metaOgDescription.setAttribute("property", "og:description");
					metaOgDescription.setAttribute("content", description);
					document.head.appendChild(metaOgDescription);
					document.querySelector('meta[name="twitter:description"]').remove();
					var metaTwitterDescription = document.createElement('meta');
					metaTwitterDescription.setAttribute("name", "twitter:description");
					metaTwitterDescription.setAttribute("content", description);
					document.head.appendChild(metaTwitterDescription);
					var tagCollection = document.createElement("div");
					tagCollection.setAttribute("class", "badge-collection");
					for (var n = 0; n < innerData.tags.length; n++) {
						var tag = document.createElement("a");
						tag.setAttribute("class", "btn badge bg-secondary me-1");
						tag.setAttribute("href", "?t=" + innerData.tags[n].toLowerCase().replace(' ','+'));
						tag.innerText = innerData.tags[n];
						tagCollection.appendChild(tag);
					}
					renderTarget.appendChild(tagCollection);
					var articleDate = document.createElement("p");
					articleDate.setAttribute("class", "description pt-0 mb-4");
					var articleInnerDate = document.createElement("small");
					articleInnerDate.innerText = innerData.date + " - David Redl";
					articleDate.appendChild(articleInnerDate);
					renderTarget.appendChild(articleDate);
					for (var n = 0; n < innerData.paragraphs.length; n++) {
						var paragraph = document.createElement("p");
						paragraph.setAttribute("class", "paragraph");
						paragraph.innerText = innerData.paragraphs[n];
						renderTarget.appendChild(paragraph);
					}
					if (innerData.links) {
						var linkBox = document.createElement("div");
						linkBox.setAttribute("class", "mb-4");
						var linkHeader = document.createElement("h4");
						linkHeader.innerText = "Links";
						linkBox.appendChild(linkHeader);
						for (var n = 0; n < innerData.links.length; n++) {
							var link = document.createElement("p");
							link.setAttribute("class", "description pt-0 pb-1");
							var innerLink = document.createElement("a");
							innerLink.setAttribute("href", innerData.links[n].link);
							innerLink.innerText = innerData.links[n].name;
							link.appendChild(innerLink);
							linkBox.appendChild(link);
						}
						renderTarget.appendChild(linkBox);
					}
					var tweetButton = document.createElement("a");
					tweetButton.setAttribute("href", "https://twitter.com/share?ref_src=twsrc%5Etfw");
					tweetButton.setAttribute("class", "twitter-share-button");
					tweetButton.setAttribute("data-text", innerData.title);
					tweetButton.setAttribute("data-via", "DavidTRedl");
					tweetButton.setAttribute("data-show-count", "false");
					tweetButton.innerText = "Tweet";
					renderTarget.appendChild(tweetButton);
					var tweetScript = document.createElement("script");
					tweetScript.setAttribute("src", "https://platform.twitter.com/widgets.js");
					tweetScript.setAttribute("charset", "utf-8");
					renderTarget.appendChild(tweetScript);
				}).catch(err => {
					var articleNotFound = document.createElement("h1");
					articleNotFound.innerText = "Oops! Article not found!";
					renderTarget.appendChild(articleNotFound);
				});
			}
			if (!idFound) {
				var articleNotFound = document.createElement("h1");
				articleNotFound.innerText = "Oops! Article not found!";
				renderTarget.appendChild(articleNotFound);
			}
		} else {
			var blogTitle = document.createElement("h1");
			blogTitle.innerText = "Journal";
			renderTarget.appendChild(blogTitle);
			renderTarget.appendChild(blogSearch);
			if (!search || articles.some(matchSearch)) { 
				for (var n = 0; n < articles.length; n++) {
					if (!filter || articles[n].tags.some(matchFilter)) {
						if (!search || matchSearch(articles[n])) {
							var article = document.createElement("div");
							article.setAttribute("class", "card mb-4");
							var articleTitle = document.createElement("h4");
							articleTitle.setAttribute("class", "ms-1");
							articleTitle.innerText = articles[n].title;
							article.appendChild(articleTitle);
							var articleSubTitle = document.createElement("p");
							articleSubTitle.setAttribute("class", "description pt-0");
							articleSubTitle.innerText = articles[n].subtitle;
							article.appendChild(articleSubTitle);
							var tagCollection = document.createElement("div");
							tagCollection.setAttribute("class", "badge-collection");
							for (var m = 0; m < articles[n].tags.length; m++) {
								var tag = document.createElement("a");
								if (filter && matchFilter(articles[n].tags[m])) {
									tag.setAttribute("class", "btn badge bg-primary me-1");
									tag.setAttribute("onclick", "clearFilter()");
									tag.innerText = articles[n].tags[m];
									var tagCancel = document.createElement("span");
									tagCancel.setAttribute("class", "ms-1 badge bg-secondary");
									tagCancel.innerText = "x";
									tag.appendChild(tagCancel);
								} else {
									tag.setAttribute("class", "btn badge bg-secondary me-1");
									tag.setAttribute("onclick", "addFilter('" + articles[n].tags[m] + "')");
									tag.innerText = articles[n].tags[m];
								}
								tagCollection.appendChild(tag);
							}
							article.appendChild(tagCollection);
							var articleDate = document.createElement("p");
							articleDate.setAttribute("class", "description pt-0");
							var articleInnerDate = document.createElement("small");
							articleInnerDate.innerText = articles[n].date;
							articleDate.appendChild(articleInnerDate);
							article.appendChild(articleDate);
							var link = document.createElement("a");
							link.setAttribute("class", "btn btn-primary w-100");
							link.setAttribute("href", "?id=" + articles[n].id);
							link.innerText = "Read";
							article.appendChild(link);
							renderTarget.appendChild(article);
						}
					}
				}
			} else {
				var noResults = document.createElement("h3");
				noResults.innerText = "No search results found";
				renderTarget.appendChild(noResults);
			}
		}
	}).catch(err => {
		var errorMessage = document.createElement("h2");
		errorMessage.innerText = "Oops! Something has gone wrong!";
		renderTarget.appendChild(errorMessage);
	});
}