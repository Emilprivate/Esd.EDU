using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Array;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Assignment;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.BitwiseExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.CompExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Expression;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Function;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.NumExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.ParameterNodes;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.PinExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Types;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.UnaryExpr;
using P4.TinyCell.Shared.Utilities;

namespace P4.TinyCell.Shared.Language.CodeGen;

public class CGeneratorVisitor : AstBaseVisitor<string>
{
    private Stack<Stack<KeyValuePair<string, TcType>>> pinTable = new();

    public override string VisitAddExprNode(AddExprNode addExprNode)
    {
        return $"{Visit(addExprNode.Left)} + {Visit(addExprNode.Right)}";
    }

    public override string VisitAndExprNode(AndExprNode andExprNode)
    {
        return $"{Visit(andExprNode.Left)} && {Visit(andExprNode.Right)}";
    }

    public override string VisitArgumentListNode(ArgumentListNode argumentListNode)
    {
        IEnumerable<string> arguments = argumentListNode.Arguments.Select(Visit);
        return $"({string.Join(", ", arguments)})";
    }

    public override string VisitArgumentNode(ArgumentNode argumentNode)
    {
        return Visit(argumentNode.Node);
    }

    public override string VisitAssignNode(AssignNode assignNode)
    {
        return $"{Visit(assignNode.Identifier)} = {Visit(assignNode.Expression)}";
    }

    public override string VisitBitshiftLExprNode(BitshiftLExprNode bitshiftLExprNode)
    {
        return $"{Visit(bitshiftLExprNode.Left)} << {Visit(bitshiftLExprNode.Right)}";
    }

    public override string VisitBitshiftRExprNode(BitshiftRExprNode bitshiftRExprNode)
    {
        return $"{Visit(bitshiftRExprNode.Left)} >> {Visit(bitshiftRExprNode.Right)}";
    }

    public override string VisitBoolNode(BoolNode boolNode)
    {
        return boolNode.Value.ToString().ToLower();
    }

    public override string VisitBreakNode(BreakNode breakNode)
    {
        return "break;";
    }

    public override string VisitContinueNode(ContinueNode continueNode)
    {
        return "continue;";
    }

    public override string VisitDeclarationNode(DeclarationNode declarationNode)
    {
        string action = declarationNode.Action is null ? string.Empty : $" = {Visit(declarationNode.Action)}";
        if (declarationNode.Type.Type == TcType.DPIN || declarationNode.Type.Type == TcType.APIN)
        {
            UpdatePinTable(
                new KeyValuePair<string, TcType>(declarationNode.Identifier.Value, declarationNode.Type.Type));
        }

        return $"{Visit(declarationNode.Type)} {Visit(declarationNode.Identifier)}{action};";
    }

    public override string VisitDivAssignNode(DivAssignNode divAssignNode)
    {
        return $"{Visit(divAssignNode.Identifier)} /= {Visit(divAssignNode.Expression)}";
    }

    public override string VisitDivExprNode(DivExprNode divExprNode)
    {
        return $"{Visit(divExprNode.Left)} / {Visit(divExprNode.Right)}";
    }

    public override string VisitEqualExprNode(EqualExprNode equalExprNode)
    {
        return $"{Visit(equalExprNode.Left)} == {Visit(equalExprNode.Right)}";
    }

    public override string VisitFloatNode(FloatNode floatNode)
    {
        return floatNode.Value.ToString();
    }

    public override string VisitForStatementNode(ForStatementNode forStatementNode)
    {
        pinTable.Push(new Stack<KeyValuePair<string, TcType>>());
        string initializer = Visit(forStatementNode.Variable);
        string condition = Visit(forStatementNode.Condition);
        string expression = Visit(forStatementNode.Expression);
        string compoundStatement = Visit(forStatementNode.CompoundStatement);
        pinTable.Pop();
        return $"for({initializer}; {condition}; {expression} {compoundStatement}";
    }

    public override string VisitFunctionCallNode(FunctionCallNode functionCallNode)
    {
        string arguments = string.Empty;
        if (functionCallNode.ArgumentList is not null)
        {
            arguments = Visit(functionCallNode.ArgumentList);
        }

        string identifier = Visit(functionCallNode.Identifier);
        if (identifier == "print")
        {
            identifier = "Serial.println";
        }

        if (identifier == "initSerial")
        {
            identifier = "Serial.begin";
        }

        return $"{identifier}{arguments}";
    }

    public override string VisitFunctionDefinitionNode(FunctionDefinitionNode functionDefinitionNode)
    {
        pinTable.Push(new Stack<KeyValuePair<string, TcType>>());

        string parameters = Visit(functionDefinitionNode.ParameterList);
        string statements = string.Empty;

        UpdatePinTable(functionDefinitionNode.ParameterList.Parameters
            .Where(p => p.TypeNode.Type == TcType.APIN || p.TypeNode.Type == TcType.DPIN)
            .Select((p) => new KeyValuePair<string, TcType>(p.Identifier.Value, p.TypeNode.Type)).ToList());

        if (functionDefinitionNode.CompoundStatement is not null)
        {
            statements = Visit(functionDefinitionNode.CompoundStatement);
        }

        pinTable.Pop();

        string identifier = Visit(functionDefinitionNode.Identifier);
        if (identifier == "update")
        {
            identifier = "loop";
        }

        return $"{Visit(functionDefinitionNode.Type)} {identifier}{parameters} {statements}";
    }

    public override string VisitGreaterThanEqualExprNode(GreaterThanEqualExprNode greaterThanOrEqualExprNode)
    {
        return $"{Visit(greaterThanOrEqualExprNode.Left)} >= {Visit(greaterThanOrEqualExprNode.Right)}";
    }

    public override string VisitGreaterThanExprNode(GreaterThanExprNode greaterThanExprNode)
    {
        return $"{Visit(greaterThanExprNode.Left)} > {Visit(greaterThanExprNode.Right)}";
    }

    public override string VisitIdentifierNode(IdentifierNode identifierNode)
    {
        return identifierNode.Value;
    }

    public override string VisitIfStatementNode(IfStatementNode ifStatementNode)
    {
        pinTable.Push(new Stack<KeyValuePair<string, TcType>>());
        string elseStatement =
            ifStatementNode.ElseExpr is null ? string.Empty : $" else {Visit(ifStatementNode.ElseExpr)}";
        string condition = Visit(ifStatementNode.Condition);
        string trueExpr = Visit(ifStatementNode.TrueExpr);
        pinTable.Pop();

        return $"if({condition}) {trueExpr}{elseStatement}";
    }

    public override string VisitIntNode(IntNode intNode)
    {
        return intNode.Value.ToString();
    }

    public override string VisitLessThanEqualExprNode(LessThanEqualExprNode lessThanOrEqualExprNode)
    {
        return $"{Visit(lessThanOrEqualExprNode.Left)} <= {Visit(lessThanOrEqualExprNode.Right)}";
    }

    public override string VisitLessThanExprNode(LessThanExprNode lessThanExprNode)
    {
        return $"{Visit(lessThanExprNode.Left)} < {Visit(lessThanExprNode.Right)}";
    }

    public override string VisitMinusAssignNode(MinusAssignNode minusAssignNode)
    {
        return $"{Visit(minusAssignNode.Identifier)} -= {Visit(minusAssignNode.Expression)}";
    }

    public override string VisitModAssignNode(ModAssignNode modAssignNode)
    {
        return $"{Visit(modAssignNode.Identifier)} %= {Visit(modAssignNode.Expression)}";
    }

    public override string VisitModExprNode(ModExprNode modExprNode)
    {
        return $"{Visit(modExprNode.Left)} % {Visit(modExprNode.Right)}";
    }

    public override string VisitMultAssignNode(MultAssignNode multAssignNode)
    {
        return $"{Visit(multAssignNode.Identifier)} *= {Visit(multAssignNode.Expression)}";
    }

    public override string VisitMultExprNode(MultExprNode multExprNode)
    {
        return $"{Visit(multExprNode.Left)} * {Visit(multExprNode.Right)}";
    }

    public override string VisitNotEqualExprNode(NotEqualExprNode notEqualExprNode)
    {
        return $"{Visit(notEqualExprNode.Left)} != {Visit(notEqualExprNode.Right)}";
    }

    public override string VisitNotExprNode(NotExprNode notExprNode)
    {
        return $"!{Visit(notExprNode.Operand)}";
    }

    public override string VisitOrExprNode(OrExprNode orExprNode)
    {
        return $"{Visit(orExprNode.Left)} || {Visit(orExprNode.Right)}";
    }

    public override string VisitParameterListNode(ParameterListNode parameterListNode)
    {
        IEnumerable<string> parameters = parameterListNode.Parameters.Select(Visit);
        return $"({string.Join(", ", parameters)})";
    }

    public override string VisitParameterNode(ParameterNode parameterNode)
    {
        string identifier = Visit(parameterNode.Identifier);
        if (parameterNode.IsArray)
        {
            identifier += "[]";
        }

        return $"{Visit(parameterNode.TypeNode)} {identifier}";
    }

    public override string VisitPinInNode(PinInNode pinInNode)
    {
        return "INPUT";
    }

    public override string VisitPinOutNode(PinOutNode pinOutNode)
    {
        return "OUTPUT";
    }

    public override string VisitPinModeExprNode(PinModeExprNode pinModeExprNode)
    {
        return $"pinMode({Visit(pinModeExprNode.Identifier)}, {Visit(pinModeExprNode.Value)})";
    }

    public override string VisitPinReadExprNode(PinReadExprNode pinReadExprNode)
    {
        TcType pinType = GetPinType(((IdentifierNode)pinReadExprNode.From).Value, pinTable);
        if (pinType == TcType.DPIN)
        {
            return $"{Visit(pinReadExprNode.To)} = digitalRead({Visit(pinReadExprNode.From)})";
        }

        return $"{Visit(pinReadExprNode.To)} = analogRead({Visit(pinReadExprNode.From)})";
    }

    public override string VisitPinWriteExprNode(PinWriteExprNode pinWriteExprNode)
    {
        TcType pinType = GetPinType(pinWriteExprNode.To.Value, pinTable);
        if (pinType == TcType.DPIN)
        {
            return $"digitalWrite({Visit(pinWriteExprNode.To)}, {Visit(pinWriteExprNode.From)})";
        }

        return $"analogWrite({Visit(pinWriteExprNode.To)}, {Visit(pinWriteExprNode.From)})";
    }

    public override string VisitPlusAssignNode(PlusAssignNode plusAssignNode)
    {
        return $"{Visit(plusAssignNode.Identifier)} += {Visit(plusAssignNode.Expression)}";
    }

    public override string VisitReturnNode(ReturnNode returnNode)
    {
        string returnExpression = returnNode.ReturnExpression is null
            ? string.Empty
            : $" {Visit(returnNode.ReturnExpression)}";
        return $"return{returnExpression};";
    }

    public override string VisitRootNode(RootNode rootNode)
    {
        pinTable.Push(new Stack<KeyValuePair<string, TcType>>());

        string code = "#include <Arduino.h> \n";
        foreach (var child in rootNode.Children)
        {
            code += $"{Visit(child)}\n";
        }

        return code;
    }

    public string VisitLibRootNode(RootNode rootNode)
    {
        pinTable.Push(new Stack<KeyValuePair<string, TcType>>());

        string code = string.Empty;
        foreach (var child in rootNode.Children)
        {
            code += $"{Visit(child)}\n";
        }

        return code;
    }

    public override string VisitStatementCollectionNode(StatementCollectionNode statementCollectionNode)
    {
        IEnumerable<string> statements = statementCollectionNode.Statements.Select(Visit);
        return $"{{{string.Join(";", statements.Select(s => "\n\t" + s))};}}";
    }

    public override string VisitStringNode(StringNode stringNode)
    {
        return $"\"{stringNode.Value}\"";
    }

    public override string VisitSubExprNode(SubExprNode subExprNode)
    {
        return $"{Visit(subExprNode.Left)}- {Visit(subExprNode.Right)}";
    }

    public override string VisitUnaryMinusExprNode(UnaryMinusExprNode unaryMinusExprNode)
    {
        return $"--{unaryMinusExprNode.Operand}";
    }

    public override string VisitUnaryPlusExprNode(UnaryPlusExprNode unaryPlusExprNode)
    {
        return $"--{unaryPlusExprNode.Operand}";
    }

    public override string VisitVoidNode(VoidNode voidNode)
    {
        return "void";
    }

    public override string VisitVolHighNode(VolHighNode volHighNode)
    {
        return "HIGH";
    }

    public override string VisitVolLowNode(VolLowNode volLowNode)
    {
        return "LOW";
    }

    public override string VisitWhileStatementNode(WhileStatementNode whileStatementNode)
    {
        pinTable.Push(new Stack<KeyValuePair<string, TcType>>());
        var condition = Visit(whileStatementNode.Condition);
        var compoundStatement = Visit(whileStatementNode.CompoundStatement);
        pinTable.Pop();

        return $"while({condition}) {compoundStatement}";
    }

    public override string VisitTypeNode(TypeNode typeNode)
    {
        if (typeNode.Type == TcType.STRING)
        {
            return "String";
        }

        if (typeNode.Type == TcType.APIN || typeNode.Type == TcType.DPIN)
        {
            return "byte";
        }

        return typeNode.Type.ToString().ToLower();
    }

    public override string VisitArrayDeclarationNode(ArrayDeclarationNode arrayDeclaration)
    {
        string elements = string.Empty;
        if (arrayDeclaration.Elements is not null)
        {
            elements = $" = {{{Visit(arrayDeclaration.Elements)}}}";
        }

        return
            $"{Visit(arrayDeclaration.TypeNode)} {Visit(arrayDeclaration.Identifier)}[{Visit(arrayDeclaration.Size)}]{elements}";
    }

    public override string VisitArrayElementsNode(ArrayElementsNode arrayElementsNode)
    {
        IEnumerable<string> elements = arrayElementsNode.Elements.Select(Visit);
        return string.Join(", ", elements);
    }

    public override string VisitArrayElemenetReferenceNode(ArrayElementReferenceNode arrayElementReferenceNode)
    {
        return $"{Visit(arrayElementReferenceNode.Identifier)}[{Visit(arrayElementReferenceNode.Index)}]";
    }

    public override string VisitArrayAssignmentNode(ArrayAssignmentNode arrayAssignmentNode)
    {
        return
            $"{Visit(arrayAssignmentNode.Identifier)}[{Visit(arrayAssignmentNode.Index)}] = {Visit(arrayAssignmentNode.Expression)}";
    }

    public override string VisitNegativeExpressionNode(NegativeExpressionNode negativeExpressionNode)
    {
        return $"-({Visit(negativeExpressionNode.Expression)})";
    }

    public override string VisitIncludeNode(IncludeNode includeNode)
    {
        if (includeNode.FileName != "default.tcl")
        {
            AstNode includeAst = AstHelper.GetAstFromFile(includeNode.FileName);
            return VisitLibRootNode((RootNode)includeAst);
        }

        return string.Empty;
    }

    private void UpdatePinTable(KeyValuePair<string, TcType> variable)
    {
        if (pinTable.First().Any(x => x.Key == variable.Key))
        {
            throw new Exception($"Variable '{variable.Key}' already declared");
        }

        pinTable.First().Push(variable);
    }

    private void UpdatePinTable(IEnumerable<KeyValuePair<string, TcType>> variables)
    {
        foreach (var variable in variables)
        {
            if (pinTable.First().Any(x => x.Key == variable.Key))
            {
                throw new Exception($"Variable '{variable.Key}' already declared");
            }

            pinTable.First().Push(variable);
        }
    }

    private static TcType GetPinType(string id, Stack<Stack<KeyValuePair<string, TcType>>> pinTable)
    {
        foreach (var stack in pinTable)
        {
            var variable = stack.FirstOrDefault(x => x.Key == id);
            if (!variable.Equals(default(KeyValuePair<string, TcType>)))
            {
                return variable.Value;
            }
        }

        throw new Exception($"Variable '{id}' not declared");
    }
}