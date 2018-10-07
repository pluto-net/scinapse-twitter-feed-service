import Axios from "axios";

interface TokenResponse {
  token_type: string;
  access_token: string;
}

interface AvailableQueryParams {
  t: string; // title
  a?: string; // author name
  j?: string; // journal name
}

interface UserMention {
  screen_name: string;
  name: string;
  id: number;
  id_str: string;
  indices: number[];
}

interface Url {
  url: string;
  expanded_url: string;
  display_url: string;
  indices: number[];
}

interface Entities {
  hashtags: any[];
  symbols: any[];
  user_mentions: UserMention[];
  urls: Url[];
}

interface Metadata {
  iso_language_code: string;
  result_type: string;
}

interface Description {
  urls: any[];
}

interface Entities2 {
  description: Description;
}

interface User {
  id: number;
  id_str: string;
  name: string;
  screen_name: string;
  location: string;
  description: string;
  url?: any;
  entities: Entities2;
  protected: boolean;
  followers_count: number;
  friends_count: number;
  listed_count: number;
  created_at: string;
  favourites_count: number;
  utc_offset?: any;
  time_zone?: any;
  geo_enabled: boolean;
  verified: boolean;
  statuses_count: number;
  lang: string;
  contributors_enabled: boolean;
  is_translator: boolean;
  is_translation_enabled: boolean;
  profile_background_color: string;
  profile_background_image_url: string;
  profile_background_image_url_https: string;
  profile_background_tile: boolean;
  profile_image_url: string;
  profile_image_url_https: string;
  profile_banner_url: string;
  profile_link_color: string;
  profile_sidebar_border_color: string;
  profile_sidebar_fill_color: string;
  profile_text_color: string;
  profile_use_background_image: boolean;
  has_extended_profile: boolean;
  default_profile: boolean;
  default_profile_image: boolean;
  following?: any;
  follow_request_sent?: any;
  notifications?: any;
  translator_type: string;
}

interface TweetResult {
  created_at: string;
  id: number;
  id_str: string;
  text: string;
  truncated: boolean;
  entities: Entities;
  metadata: Metadata;
  source: string;
  in_reply_to_status_id: number;
  in_reply_to_status_id_str: string;
  in_reply_to_user_id: number;
  in_reply_to_user_id_str: string;
  in_reply_to_screen_name: string;
  user: User;
  geo?: any;
  coordinates?: any;
  place?: any;
  contributors?: any;
  is_quote_status: boolean;
  retweet_count: number;
  favorite_count: number;
  favorited: boolean;
  retweeted: boolean;
  lang: string;
}

interface SearchMetadata {
  completed_in: number;
  max_id: number;
  max_id_str: string;
  next_results: string;
  query: string;
  refresh_url: string;
  count: number;
  since_id: number;
  since_id_str: string;
}

interface TweetSearchResult {
  statuses: TweetResult[];
  search_metadata: SearchMetadata;
}

function logError(err, errorName: string, callback: Function) {
  console.log(
    `==================== HAD ERROR TO ${errorName} ====================`
  );
  console.error(err.message);
  console.error(err.response.data);
  console.log(
    `==================== HAD ERROR TO ${errorName} ====================`
  );

  const response = {
    statusCode: 400,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      error: err.response.data || err.message
    })
  };

  return callback(null, response);
}

async function getTwitterToken(callback: Function) {
  const TWITTER_SERVICE_KEY = process.env.TWITTER_SERVICE_KEY;
  const TWITTER_SECRET_KEY = process.env.TWITTER_SECRET_KEY;
  const rawBearerToken = `${TWITTER_SERVICE_KEY}:${TWITTER_SECRET_KEY}`;
  const bearerToken = new Buffer(rawBearerToken).toString("base64");

  try {
    const tokenRes = await Axios.post(
      "https://api.twitter.com/oauth2/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${bearerToken}`,
          ["Content-Type"]: "application/x-www-form-urlencoded;charset=UTF-8"
        }
      }
    );

    const tokenInfo: TokenResponse = tokenRes.data;

    return tokenInfo.access_token;
  } catch (err) {
    return logError(err, "GET_BEARER_TOKEN", callback);
  }
}

async function searchTweets(
  token: string,
  searchQuery: string,
  callback: Function
) {
  console.log(searchQuery);
  try {
    const result = await Axios.get(
      "https://api.twitter.com/1.1/search/tweets.json",
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          q: encodeURIComponent(searchQuery)
        }
      }
    );

    const titleTweetResponse = result.data as TweetSearchResult;

    return titleTweetResponse.statuses;
  } catch (err) {
    return logError(err, "GET_TWEETS_FROM_TITLE_SEARCH", callback);
  }
}

export async function getTweetFeed(event, context, callback) {
  const queryParams = event.queryStringParameters;

  if (!queryParams || !queryParams.t) {
    const response = {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Invalid Parameters."
      })
    };

    return callback(null, response);
  }

  const title = queryParams.t;
  const authorName = queryParams.a;
  const journalName = queryParams.j;
  const token: string = await getTwitterToken(callback);

  let tweets: TweetResult[] = [];
  tweets = await searchTweets(token, title, callback);

  if (tweets.length < 10) {
    const authorNameResult = await searchTweets(
      token,
      `"${authorName}"`,
      callback
    );
    tweets = [...tweets, ...authorNameResult];
  }

  if (tweets.length < 10) {
    const journalNameResult = await searchTweets(
      token,
      `"${journalName}"`,
      callback
    );
    tweets = [...tweets, ...journalNameResult];
  }

  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      data: tweets
    })
  };

  return callback(null, response);
}
