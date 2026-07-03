/**
 * https://medium.com/@navarend/stop-abusing-try-catch-4-error-handling-patterns-for-scalable-node-js-apps-66bc9478ea3b
 * 
 * Base application error class
 * All custom errors extend this to maintain consistent structure
 * 
 * @property message - Human-readable error message
 * @property statusCode - HTTP status code (404, 500, etc.)
 * @property code - Machine-readable error code (e.g., 'GAME_NOT_FOUND')
 * @property isOperational - True if this is an expected business error, not a bug
 * @property timestamp - When the error occurred (useful for logging)
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name; // Preserves class name in stack traces
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Capture stack trace (Node.js environment)
    if (this.captureStackTrace) {
      this.captureStackTrace(this, this.constructor);
    }
  }
}

export class DevelopmentError extends AppError {
	constructor(message: string = 'Haven’t gotten that far yet.') {
		super(
			message,
			666,
			'NOT_YET_DEVELOPED',
			false
		);
	}
}

/**
 * Game-specific errors
 */
export class GameNotFoundError extends AppError {
  constructor(gameId: string) {
    super(
      `Game with ID "${gameId}" not found`,
      404,
      'GAME_NOT_FOUND',
      true
    );
  }
}

export class GameOverError extends AppError {
  constructor(message: string = 'Game has already ended') {
    super(message, 400, 'GAME_OVER', true);
  }
}

export class InvalidMoveError extends AppError {
  constructor(message: string = 'Invalid move') {
    super(message, 400, 'INVALID_MOVE', true);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 0, 'NETWORK_ERROR', true); // 0 status = network error
  }
}

/**
 * API response errors (for when backend returns error info)
 */
export class ApiError extends AppError {
  public readonly response?: Response;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    response?: Response
  ) {
    super(message, statusCode, code, true);
    this.response = response;
  }
}



/**
 * Error Modal Types
 * 
 * These types define the structure for error modals that appear when
 * API calls or network operations fail.
 * 
 * The design follows a user-centric approach:
 * - userMust: Actions the user MUST take to resolve the error (e.g., "Please log in")
 * - userMay: Optional actions the user MAY take (e.g., "Try again", "Go back")
 * 
 * This pattern makes error handling more intentional and user-friendly.
 */

// ==========================================================================
// ERROR MODAL ACTION TYPES
// ==========================================================================

/**
 * Represents a single action button in an error modal
 * 
 * @property text - The label displayed on the button
 * @property method - The function to call when the button is clicked
 * @property variant - Optional: visual style variant for the button (default: "default")
 * @property isPrimary - Optional: whether this is the primary/recommended action
 */
export interface ModalAction {
  text: string;
  method?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'cancel';
  isPrimary?: boolean;
}

// ==========================================================================
// ERROR MODAL TYPE
// ==========================================================================

/**
 * Structure for displaying error information to users in a modal dialog
 * 
 * @property title - Short, human-readable title for the error (e.g., "Connection Failed")
 * @property message - Detailed description of what went wrong
 * @property userMust - Actions the user MUST take to resolve the error.
 *                    If this array is non-empty, the modal will emphasize these actions.
 *                    Example: [{text: "Log In", method: openLoginModal}]
 * @property userMay - Optional actions the user can take.
 *                    These are secondary/tertiary options.
 *                    Example: [{text: "Try Again", method: retryFunction}, 
 *                             {text: "Go Back", method: goBackFunction}]
 * @property severity - Visual severity level (affects styling)
 * @property errorCode - Optional: machine-readable error code for logging/analytics
 * 
 * Usage example:
 * ```typescript
 * setErrorModal({
 *   title: "Network Error",
 *   message: "Unable to connect to the server. Please check your connection.",
 *   userMust: ModalAction[];
 *   userMay: [
 *     { text: "Try Again", method: () => handleDrawCard(), isPrimary: true },
 *     { text: "Cancel", method: () => setErrorModal(null), variant: "outline" }
 *   ]
 * });
 * ```
 */
export interface ErrorModalConfig {
  title: string;
  message: string;
  userMust: ModalAction[];
  userMay: ModalAction[];
  severity?: 'info' | 'warning' | 'error' | 'critical';
  errorCode?: string;
	close(): void;
}

// ==========================================================================
// FACTORY FUNCTIONS FOR COMMON ERROR MODALS
// ==========================================================================

/**
 * Helper to create a network error modal with a "Try Again" button
 * 
 * @param message - Custom message, or defaults to generic network error
 * @returns ErrorModal configured for network errors
 */
export const createNetworkErrorModal = (
	message: string = "Unable to connect to the server. Please check your internet connection.",
	userMust: ModalAction[] = [],
	userMay: ModalAction[] = [],
	close: () => void,
): ErrorModalConfig => ({
  title: "Network Connection Problem",
  message: message,
  userMust: userMust,
  userMay: userMay,
  severity: "error",
  errorCode: "NETWORK_ERROR",
	close: close
});

/**
 * Helper to create an API error modal
 * 
 * @param title - Error title
 * @param message - Error description
 * @param actions - Array of action buttons to show
 * @param severity - Error severity level
 * @param errorCode - Machine-readable error code
 * @returns ErrorModal configured for API errors
 */
// export const createApiErrorModal = (
//   title: string,
//   message: string,
//   actions: ModalAction[] = [],
//   severity: 'info' | 'warning' | 'error' | 'critical' = "error",
//   errorCode?: string
// ): ErrorModal => ({
//   title: title,
//   message: message,
//   userMust: [],
//   userMay: actions.length > 0 ? actions : [{ text: "OK", method: () => {}, isPrimary: true }],
//   severity: severity,
//   errorCode: errorCode
// });

/**
 * Helper to create a validation error modal (user must take action)
 * 
 * @param title - Error title
 * @param message - Error description
 * @param requiredActions - Actions the user MUST take (these will be emphasized)
 * @param optionalActions - Optional actions the user can take
 * @returns ErrorModal configured for validation errors
 */
// export const createValidationErrorModal = (
//   title: string,
//   message: string,
//   requiredActions: ModalAction[] = [],
//   optionalActions: ModalAction[] = []
// ): ErrorModal => ({
//   title: title,
//   message: message,
//   userMust: requiredActions,
//   userMay: optionalActions,
//   severity: "warning",
//   errorCode: "VALIDATION_ERROR"
// });
