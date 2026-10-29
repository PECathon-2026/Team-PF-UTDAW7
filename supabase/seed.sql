-- ==============================================================================
-- Seed Data: 14 Curated Small Web Blogs & Realistic Co-Subscription Matrix
-- ==============================================================================

INSERT INTO feeds (id, normalized_url, original_url, site_url, title, description, category, popularity)
VALUES
  ('danluu', 'https://danluu.com/atom.xml', 'https://danluu.com/atom.xml', 'https://danluu.com', 'Dan Luu', 'In-depth empirical research on hardware performance, software latency, and engineering culture.', 'Systems & Architecture', 142),
  ('jvns', 'https://jvns.ca/atom.xml', 'https://jvns.ca/atom.xml', 'https://jvns.ca', 'Julia Evans', 'Zines, programming curiosity, DNS debugging, and accessible systems internals.', 'Systems & Architecture', 128),
  ('simonwillison', 'https://simonwillison.net/atom/entries', 'https://simonwillison.net/atom/entries/', 'https://simonwillison.net', 'Simon Willison', 'Creator of Datasette and co-creator of Django, exploring AI architectures and open web tooling.', 'Engineering & AI', 119),
  ('maggieappleton', 'https://maggieappleton.com/rss.xml', 'https://maggieappleton.com/rss.xml', 'https://maggieappleton.com', 'Maggie Appleton', 'Illustrated essays on digital gardens, visual thinking, and human-computer symbiosis.', 'Design & Craft', 96),
  ('marginalian', 'https://themarginalian.org/feed', 'https://www.themarginalian.org/feed/', 'https://www.themarginalian.org', 'The Marginalian', 'Maria Popova timeless reflections on art, science, philosophy, and the search for meaning.', 'Culture & Philosophy', 135),
  ('kevquirk', 'https://kevquirk.com/feed', 'https://kevquirk.com/feed', 'https://kevquirk.com', 'Kev Quirk', 'Passionate advocate for the open web, digital minimalism, and personal blogging.', 'Indie Web', 84),
  ('robinsloan', 'https://robinsloan.com/feed.xml', 'https://www.robinsloan.com/feed.xml', 'https://www.robinsloan.com', 'Robin Sloan', 'Author and media tinkerer writing about small software, speculative fiction, and olive oil.', 'Design & Craft', 77),
  ('craigmod', 'https://craigmod.com/index.xml', 'https://craigmod.com/index.xml', 'https://craigmod.com', 'Craig Mod', 'Walking monographs, slow publishing, photographic meditations, and bookmaking.', 'Culture & Philosophy', 81),
  ('sivers', 'https://sive.rs/en.atom', 'https://sive.rs/en.atom', 'https://sive.rs', 'Derek Sivers', 'Philosophical notes on entrepreneurship, independent living, and deliberate simplicity.', 'Culture & Philosophy', 110),
  ('alistapart', 'https://alistapart.com/main/feed', 'https://alistapart.com/main/feed/', 'https://alistapart.com', 'A List Apart', 'Exploring the design, development, and meaning of web content since 1998.', 'Design & Craft', 104),
  ('stratechery', 'https://stratechery.com/feed', 'https://stratechery.com/feed/', 'https://stratechery.com', 'Stratechery', 'Ben Thompson analysis of tech business models, aggregation theory, and strategy.', 'Tech Strategy', 92),
  ('gwern', 'https://gwern.net/feed', 'https://gwern.net/feed', 'https://gwern.net', 'Gwern Branwen', 'Long-form empirical investigations into statistical epistemology, machine learning, and rationality.', 'Systems & Architecture', 88),
  ('xeiaso', 'https://xeiaso.net/blog.rss', 'https://xeiaso.net/blog.rss', 'https://xeiaso.net', 'Xe Iaso', 'Philosophical technology musings, NixOS deep dives, and narrative programming essays.', 'Systems & Architecture', 73),
  ('tracydurnell', 'https://tracydurnell.com/feed', 'https://tracydurnell.com/feed/', 'https://tracydurnell.com', 'Tracy Durnell', 'IndieWeb advocate writing about books, gardening, personal computing, and slow media.', 'Indie Web', 61)
ON CONFLICT (normalized_url) DO UPDATE
SET popularity = EXCLUDED.popularity, title = EXCLUDED.title;

-- Pre-populated Co-Subscriptions (feed_a < feed_b)
INSERT INTO co_subscriptions (feed_a, feed_b, weight)
VALUES
  ('https://danluu.com/atom.xml', 'https://jvns.ca/atom.xml', 94),
  ('https://danluu.com/atom.xml', 'https://simonwillison.net/atom/entries', 78),
  ('https://jvns.ca/atom.xml', 'https://simonwillison.net/atom/entries', 81),
  ('https://danluu.com/atom.xml', 'https://xeiaso.net/blog.rss', 62),
  ('https://jvns.ca/atom.xml', 'https://xeiaso.net/blog.rss', 65),
  ('https://danluu.com/atom.xml', 'https://gwern.net/feed', 58),
  ('https://gwern.net/feed', 'https://simonwillison.net/atom/entries', 51),
  ('https://craigmod.com/index.xml', 'https://robinsloan.com/feed.xml', 72),
  ('https://maggieappleton.com/rss.xml', 'https://robinsloan.com/feed.xml', 68),
  ('https://craigmod.com/index.xml', 'https://themarginalian.org/feed', 64),
  ('https://maggieappleton.com/rss.xml', 'https://themarginalian.org/feed', 59),
  ('https://sive.rs/en.atom', 'https://themarginalian.org/feed', 75),
  ('https://craigmod.com/index.xml', 'https://sive.rs/en.atom', 54),
  ('https://kevquirk.com/feed', 'https://tracydurnell.com/feed', 56),
  ('https://alistapart.com/main/feed', 'https://maggieappleton.com/rss.xml', 61),
  ('https://kevquirk.com/feed', 'https://maggieappleton.com/rss.xml', 48),
  ('https://danluu.com/atom.xml', 'https://stratechery.com/feed', 45),
  ('https://simonwillison.net/atom/entries', 'https://stratechery.com/feed', 49)
ON CONFLICT (feed_a, feed_b) DO UPDATE
SET weight = EXCLUDED.weight;
