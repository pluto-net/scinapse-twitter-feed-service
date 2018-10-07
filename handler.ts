import Axios from "axios";

interface TokenResponse {
  token_type: string;
  access_token: string;
}

interface User {
  id: any;
  id_str: string;
  name: string;
  screen_name: string;
  location: string;
  url: string;
  description: string;
  translator_type: string;
  protected: boolean;
  verified: boolean;
  followers_count: number;
  friends_count: number;
  listed_count: number;
  favourites_count: number;
  statuses_count: number;
  created_at: string;
  utc_offset?: any;
  time_zone?: any;
  geo_enabled: boolean;
  lang: string;
  contributors_enabled: boolean;
  is_translator: boolean;
  profile_background_color: string;
  profile_background_image_url: string;
  profile_background_image_url_https: string;
  profile_background_tile: boolean;
  profile_link_color: string;
  profile_sidebar_border_color: string;
  profile_sidebar_fill_color: string;
  profile_text_color: string;
  profile_use_background_image: boolean;
  profile_image_url: string;
  profile_image_url_https: string;
  profile_banner_url: string;
  default_profile: boolean;
  default_profile_image: boolean;
  following?: any;
  follow_request_sent?: any;
  notifications?: any;
}

interface TweetResult {
  created_at: string;
  id: any;
  id_str: string;
  text: string;
  display_text_range: number[];
  source: string;
  truncated: boolean;
  in_reply_to_status_id: any;
  in_reply_to_status_id_str: string;
  in_reply_to_user_id?: number;
  in_reply_to_user_id_str: string;
  in_reply_to_screen_name: string;
  user: User;
  geo?: any;
  coordinates?: any;
  place: any;
  contributors?: any;
  is_quote_status: boolean;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  favorite_count: number;
  entities: any;
  favorited: boolean;
  retweeted: boolean;
  filter_level: string;
  lang: string;
  matching_rules: any[];
  extended_tweet: any;
  retweeted_status: any;
  possibly_sensitive?: boolean;
  quoted_status_id?: number;
  quoted_status_id_str: string;
  quoted_status: any;
  quoted_status_permalink: any;
  extended_entities: any;
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

function logError(err, errorName: string) {
  console.log(
    `==================== HAD ERROR TO ${errorName} ====================`
  );
  console.error(err.message);
  console.error(err.response.data);
  console.log(
    `==================== HAD ERROR TO ${errorName} ====================`
  );
}

async function getTwitterToken() {
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
    logError(err, "GET_BEARER_TOKEN");
  }
}

export async function getTweetFeed(event, context, callback) {
  const queryParams = event.queryStringParameters;
  if (!queryParams || !queryParams.q) {
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

  const token = await getTwitterToken();
  let tweets: TweetResult[] = [];

  try {
    const result = await Axios.get(
      "https://api.twitter.com/1.1/search/tweets.json",
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          q: queryParams.q
        }
      }
    );

    console.log(result);

    const titleTweetResponse = result.data as TweetSearchResult;

    tweets = titleTweetResponse.statuses;
  } catch (err) {
    logError(err, "GET_TWEETS_FROM_TITLE_SEARCH");
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
