grammar TinyCell;

document: (
		include* generalDeclaration* setupDefinition updateDefinition
	)
	| include* functionDefinition+;

include: INCLUDE tclib SEMI;

generalDeclaration: functionDefinition | declaration SEMI;

setupDefinition: SETUP compoundStatement;

updateDefinition: UPDATE compoundStatement;

functionDefinition:
	type identifier LPAR parameterList* RPAR (
		compoundStatement
		| SEMI
	);

type: VOID | STRING | INT | FLOAT | BOOL | DPIN | APIN;

parameterList: parameter | parameterList COMMA parameter;

parameter: type identifier (LBRACKET RBRACKET)?;

argumentList: argument | argumentList COMMA argument;

argument:
	identifier (LBRACKET arrayIndex RBRACKET)?
	| functionCall
	| numeral
	| String
	| Bool;

declaration:
	type identifier (LBRACKET arrayIndex RBRACKET)? (
		ASSIGN ( expression | functionCall)
	)?;

compoundStatement: LCURLY statement* RCURLY;

statement:
	ifStatement
	| loopStatement
	| jumpStatement
	| declaration SEMI
	| functionCall SEMI
	| pinStatusExpression SEMI
	| assignment SEMI
	| expression SEMI;

ifStatement:
	IF LPAR expression RPAR compoundStatement ELSE compoundStatement
	| IF LPAR expression RPAR compoundStatement;

loopStatement:
	WHILE LPAR expression RPAR compoundStatement
	| FOR LPAR (expression | declaration) SEMI expression SEMI (
		expression
		| assignment
	) RPAR compoundStatement;

jumpStatement:
	CONTINUE SEMI
	| BREAK SEMI
	| RETURN expression? SEMI;

assignment:
	identifier (LBRACKET arrayIndex RBRACKET)? assignmentOperator expression;

functionCall: identifier LPAR argumentList* RPAR;

//arrayContent: numeral | String | Bool | identifier;

arrayContent: negativeExpression;

arrayIndex: IntNumeral | identifier;

primitiveExpression:
	numeral
	| Bool
	| String
	| identifier (LBRACKET arrayIndex RBRACKET)?
	| functionCall
	| LCURLY (arrayContent COMMA)* arrayContent RCURLY
	| LPAR expression RPAR;

negativeExpression:
	primitiveExpression
	| MINUS (
		numeral
		| identifier (LBRACKET arrayIndex RBRACKET)?
		| functionCall
	)
	| MINUS LPAR expression RPAR;

unaryExpression:
	negativeExpression
	| identifier UNARYPLUS
	| identifier UNARYMINUS
	| UNARYPLUS identifier
	| UNARYMINUS identifier
	| NOT negativeExpression;

multiplicativeExpression:
	unaryExpression
	| multiplicativeExpression MULT primitiveExpression
	| multiplicativeExpression DIV primitiveExpression
	| multiplicativeExpression MOD primitiveExpression;

additiveExpression:
	multiplicativeExpression
	| additiveExpression PLUS multiplicativeExpression
	| additiveExpression MINUS multiplicativeExpression;

bitshiftExpression:
	additiveExpression
	| bitshiftExpression BITSHIFTL additiveExpression
	| bitshiftExpression BITSHIFTR additiveExpression;

comparisonExpression:
	bitshiftExpression
	| comparisonExpression LT bitshiftExpression
	| comparisonExpression GT bitshiftExpression
	| comparisonExpression LTE bitshiftExpression
	| comparisonExpression GTE bitshiftExpression;

equalityExpression:
	comparisonExpression
	| equalityExpression EQ comparisonExpression
	| equalityExpression NEQ comparisonExpression;

andExpression:
	equalityExpression
	| andExpression AND equalityExpression;

orExpression: andExpression | orExpression OR andExpression;

ternaryExpression:
	orExpression
	| orExpression QUESTION (
		expression
		| functionCall
		| assignment
	) COLON (expression | functionCall | assignment);

expression: ternaryExpression;

pinAssignmentExpression:
	WRITE (pinVoltage | Bool | identifier | IntNumeral) TO identifier
	| READ identifier TO identifier;

pinStatusExpression:
	pinAssignmentExpression
	| SET identifier TO pinStatus;

identifier: Identifier;

tclib: LibraryIdent;

assignmentOperator:
	ASSIGN
	| MULTASSIGN
	| DIVASSIGN
	| MODASSIGN
	| PLUSASSIGN
	| MINUSASSIGN;

pinVoltage: VOLHIGH | VOLLOW;

pinStatus: PININ | PINOUT;

numeral: FloatNumeral | IntNumeral;

Bool: (TRUE | FALSE);

Whitespace: [ \t\r\n]+ -> channel(HIDDEN);

//Pin op
VOLHIGH: 'HIGH';
VOLLOW: 'LOW';
PININ: 'INPUT';
PINOUT: 'OUTPUT';
//Types
DPIN: 'dpin';
APIN: 'apin';
INT: 'int';
FLOAT: 'float';
STRING: 'string';
BOOL: 'bool';
VOID: 'void';
CHAR: 'char';
//Keywords
UPDATE: 'update';
SETUP: 'setup';
SET: 'set';
TO: 'to';
READ: 'read';
WRITE: 'write';
IF: 'if';
ELSE: 'else';
WHILE: 'while';
FOR: 'for';
CONTINUE: 'continue';
BREAK: 'break';
RETURN: 'return';
INCLUDE: 'include';
QUESTION: '?';
LPAR: '(';
RPAR: ')';
LCURLY: '{';
RCURLY: '}';
LBRACKET: '[';
RBRACKET: ']';
SEMI: ';';
DOT: '.';
COMMA: ',';
COLON: ':';
TRUE: 'true';
FALSE: 'false';
NEWLINE: '\n';
//Assignment op
ASSIGN: '=';
PLUSASSIGN: '+=';
MULTASSIGN: '*=';
DIVASSIGN: '/=';
MODASSIGN: '%=';
MINUSASSIGN: '-=';
QUOTE: '"';
//Op
MULT: '*';
DIV: '/';
PLUS: '+';
MINUS: '-';
MOD: '%';
//Relational op
AND: '&&';
OR: '||';
EQ: '==';
NEQ: '!=';
GT: '>';
LT: '<';
GTE: '>=';
LTE: '<=';
NOT: '!';
//Bitwise op
BITSHIFTL: '<<';
BITSHIFTR: '>>';
//Unary op
UNARYPLUS: '++';
UNARYMINUS: '--';

Identifier: [a-zA-Z_][a-zA-Z0-9_]*;

LibraryIdent: Identifier DOT 'tcl';

String: QUOTE ([ a-zA-Z0-9_!@#$%^&()=;:'<>,.?/`~])* QUOTE;

FloatNumeral: [0-9]+ [.][0-9]+;

IntNumeral: [0-9]+;

BlockComment: '/*' .*? '*/' -> channel(HIDDEN);

LineComment: '//' ~[\r\n]* -> channel(HIDDEN);

Newline: ('\r' '\n'? | '\n' | '\\n') -> channel(HIDDEN);