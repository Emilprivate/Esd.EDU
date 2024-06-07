using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Function;

public class FunctionCallNode : AstNode
{
    public IdentifierNode Identifier { get; set; }
    public ArgumentListNode? ArgumentList { get; set; }

    public FunctionCallNode(IdentifierNode identifier, ArgumentListNode? argumentList)
    {
        Identifier = identifier;
        ArgumentList = argumentList;

        AddChild(identifier);
        if (argumentList is not null)
        {
            AddChild(argumentList);
        }
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitFunctionCallNode(this);
    }
}