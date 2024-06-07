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

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree;

public partial class AstBaseVisitor<Result> : IAstVisitor<Result>
{
    public virtual Result Visit(AstNode node)
    {
        return node.Accept(this);
    }

    public virtual Result VisitChildren(AstNode node)
    {
        Result res = default;

        foreach (AstNode child in node.Children)
        {
            res = child.Accept(this);
        }

        return res;
    }

    public virtual Result VisitAddExprNode(AddExprNode addExprNode)
    {
        return VisitChildren(addExprNode);
    }

    public virtual Result VisitAndExprNode(AndExprNode andExprNode)
    {
        return VisitChildren(andExprNode);
    }

    public virtual Result VisitArgumentListNode(ArgumentListNode argumentListNode)
    {
        return VisitChildren(argumentListNode);
    }

    public virtual Result VisitArgumentNode(ArgumentNode argumentNode)
    {
        return VisitChildren(argumentNode);
    }

    public virtual Result VisitAssignNode(AssignNode assignNode)
    {
        return VisitChildren(assignNode);
    }

    public virtual Result VisitBitshiftLExprNode(BitshiftLExprNode bitshiftLExprNode)
    {
        return VisitChildren(bitshiftLExprNode);
    }

    public virtual Result VisitBitshiftRExprNode(BitshiftRExprNode bitshiftRExprNode)
    {
        return VisitChildren(bitshiftRExprNode);
    }

    public virtual Result VisitBoolNode(BoolNode boolNode)
    {
        return VisitChildren(boolNode);
    }

    public virtual Result VisitBreakNode(BreakNode breakNode)
    {
        return VisitChildren(breakNode);
    }

    public virtual Result VisitContinueNode(ContinueNode continueNode)
    {
        return VisitChildren(continueNode);
    }

    public virtual Result VisitDeclarationNode(DeclarationNode declarationNode)
    {
        return VisitChildren(declarationNode);
    }

    public virtual Result VisitDivAssignNode(DivAssignNode divAssignNode)
    {
        return VisitChildren(divAssignNode);
    }

    public virtual Result VisitDivExprNode(DivExprNode divExprNode)
    {
        return VisitChildren(divExprNode);
    }

    public virtual Result VisitEqualExprNode(EqualExprNode equalExprNode)
    {
        return VisitChildren(equalExprNode);
    }

    public virtual Result VisitFloatNode(FloatNode floatNode)
    {
        return VisitChildren(floatNode);
    }

    public virtual Result VisitForStatementNode(ForStatementNode forStatementNode)
    {
        return VisitChildren(forStatementNode);
    }

    public virtual Result VisitFunctionCallNode(FunctionCallNode functionCallNode)
    {
        return VisitChildren(functionCallNode);
    }

    public virtual Result VisitFunctionDefinitionNode(FunctionDefinitionNode functionDefinitionNode)
    {
        return VisitChildren(functionDefinitionNode);
    }

    public virtual Result VisitGreaterThanEqualExprNode(GreaterThanEqualExprNode greaterThanOrEqualExprNode)
    {
        return VisitChildren(greaterThanOrEqualExprNode);
    }

    public virtual Result VisitGreaterThanExprNode(GreaterThanExprNode greaterThanExprNode)
    {
        return VisitChildren(greaterThanExprNode);
    }

    public virtual Result VisitIdentifierNode(IdentifierNode identifierNode)
    {
        return VisitChildren(identifierNode);
    }

    public virtual Result VisitIfStatementNode(IfStatementNode ifStatementNode)
    {
        return VisitChildren(ifStatementNode);
    }

    public virtual Result VisitIntNode(IntNode intNode)
    {
        return VisitChildren(intNode);
    }

    public virtual Result VisitLessThanEqualExprNode(LessThanEqualExprNode lessThanOrEqualExprNode)
    {
        return VisitChildren(lessThanOrEqualExprNode);
    }

    public virtual Result VisitLessThanExprNode(LessThanExprNode lessThanExprNode)
    {
        return VisitChildren(lessThanExprNode);
    }

    public virtual Result VisitMinusAssignNode(MinusAssignNode minusAssignNode)
    {
        return VisitChildren(minusAssignNode);
    }

    public virtual Result VisitModAssignNode(ModAssignNode modAssignNode)
    {
        return VisitChildren(modAssignNode);
    }

    public virtual Result VisitModExprNode(ModExprNode modExprNode)
    {
        return VisitChildren(modExprNode);
    }

    public virtual Result VisitMultAssignNode(MultAssignNode multAssignNode)
    {
        return VisitChildren(multAssignNode);
    }

    public virtual Result VisitMultExprNode(MultExprNode multExprNode)
    {
        return VisitChildren(multExprNode);
    }

    public virtual Result VisitNotEqualExprNode(NotEqualExprNode notEqualExprNode)
    {
        return VisitChildren(notEqualExprNode);
    }

    public virtual Result VisitNotExprNode(NotExprNode notExprNode)
    {
        return VisitChildren(notExprNode);
    }

    public virtual Result VisitOrExprNode(OrExprNode orExprNode)
    {
        return VisitChildren(orExprNode);
    }

    public virtual Result VisitParameterListNode(ParameterListNode parameterListNode)
    {
        return VisitChildren(parameterListNode);
    }

    public virtual Result VisitParameterNode(ParameterNode parameterNode)
    {
        return VisitChildren(parameterNode);
    }

    public virtual Result VisitPinModeExprNode(PinModeExprNode pinModeExprNode)
    {
        return VisitChildren(pinModeExprNode);
    }

    public virtual Result VisitPinReadExprNode(PinReadExprNode pinReadExprNode)
    {
        return VisitChildren(pinReadExprNode);
    }

    public virtual Result VisitPinWriteExprNode(PinWriteExprNode pinWriteExprNode)
    {
        return VisitChildren(pinWriteExprNode);
    }

    public virtual Result VisitPinOutNode(PinOutNode pinOutNode)
    {
        return VisitChildren(pinOutNode);
    }

    public virtual Result VisitPinInNode(PinInNode pinInNode)
    {
        return VisitChildren(pinInNode);
    }

    public virtual Result VisitPlusAssignNode(PlusAssignNode plusAssignNode)
    {
        return VisitChildren(plusAssignNode);
    }

    public virtual Result VisitReturnNode(ReturnNode returnNode)
    {
        return VisitChildren(returnNode);
    }

    public virtual Result VisitRootNode(RootNode rootNode)
    {
        return VisitChildren(rootNode);
    }

    public virtual Result VisitStatementCollectionNode(StatementCollectionNode statementCollectionNode)
    {
        return VisitChildren(statementCollectionNode);
    }

    public virtual Result VisitStringNode(StringNode stringNode)
    {
        return VisitChildren(stringNode);
    }

    public virtual Result VisitSubExprNode(SubExprNode subExprNode)
    {
        return VisitChildren(subExprNode);
    }

    public virtual Result VisitUnaryMinusExprNode(UnaryMinusExprNode unaryMinusExprNode)
    {
        return VisitChildren(unaryMinusExprNode);
    }

    public virtual Result VisitUnaryPlusExprNode(UnaryPlusExprNode unaryPlusExprNode)
    {
        return VisitChildren(unaryPlusExprNode);
    }

    public virtual Result VisitVoidNode(VoidNode voidNode)
    {
        return VisitChildren(voidNode);
    }

    public virtual Result VisitVolHighNode(VolHighNode volHighNode)
    {
        return VisitChildren(volHighNode);
    }

    public virtual Result VisitVolLowNode(VolLowNode volLowNode)
    {
        return VisitChildren(volLowNode);
    }

    public virtual Result VisitWhileStatementNode(WhileStatementNode whileStatementNode)
    {
        return VisitChildren(whileStatementNode);
    }

    public virtual Result VisitTypeNode(TypeNode typeNode)
    {
        return VisitChildren(typeNode);
    }

    public virtual Result VisitArrayDeclarationNode(ArrayDeclarationNode arrayDeclaration)
    {
        return VisitChildren(arrayDeclaration);
    }

    public virtual Result VisitIncludeNode(IncludeNode includeNode)
    {
        return VisitChildren(includeNode);
    }

    public virtual Result VisitArrayElementsNode(ArrayElementsNode elements)
    {
        return VisitChildren(elements);
    }

    public virtual Result VisitArrayElemenetReferenceNode(ArrayElementReferenceNode arrayElementReferenceNode)
    {
        return VisitChildren(arrayElementReferenceNode);
    }

    public virtual Result VisitArrayAssignmentNode(ArrayAssignmentNode arrayAssignmentNode)
    {
        return VisitChildren(arrayAssignmentNode);
    }

    public virtual Result VisitNegativeExpressionNode(NegativeExpressionNode negativeExpressionNode)
    {
        return VisitChildren(negativeExpressionNode);
    }
}