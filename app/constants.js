function define(name, value) {
    Object.defineProperty(exports, name, {
	value:      value,
	enumerable: true
    });
}

/* Definition of code returned by API */
define("_CODE_OK_", 0);
define("_CODE_CREATED_", 1);
define("_CODE_DELETED_", 2);
define("_CODE_MODIFIED_", 3);
define("_CODE_WELCOME_", 4);
define("_CODE_FAILED_", -1);
define("_CODE_ARGS_", -2);
define("_CODE_TOKEN_", -3);
define("_CODE_ERROR_", 403);

/* Definition of message returned by API */
define("_MSG_OK_", "Successfully fetched");
define("_MSG_CREATED_", "Successfully created");
define("_MSG_DELETED_", "Successfully deleted");
define("_MSG_MODIFIED_", "Successfully modified");
define("_MSG_OBJECT_NOT_FOUND_", "Object not found")
define("_MSG_FAILED_", "Error occurred, check your request or contact administrator");
define("_MSG_UNKNOWN_", "An unknown error occured, contact administrator");
define("_MSG_ARGS_", "Bad JSON body or Argument(s) provided");
define("_MSG_TOKEN_", "Error relevant to token API ('Authorization' header)");
define("_MSG_UNAUTHORIZED_", "Your user is not allowed to access to this resource");
define("_MSG_MISSING_PARAMS_", "Missing params");

/* Definition of global variables */
define("_TRUE_", "true");
define("_MSG_WELCOME_", "Welcome message");

