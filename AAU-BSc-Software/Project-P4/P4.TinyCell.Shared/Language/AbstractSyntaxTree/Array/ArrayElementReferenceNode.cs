using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Array;

public class ArrayElementReferenceNode : AstNode
{
    public IdentifierNode Identifier { get; set; }
    public AstNode Index { get; set; }


    public ArrayElementReferenceNode(IdentifierNode identifier, AstNode index)
    {
        Identifier = identifier;
        Index = index;
        AddChild(identifier);
        AddChild(index);
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitArrayElemenetReferenceNode(this);
    }
}