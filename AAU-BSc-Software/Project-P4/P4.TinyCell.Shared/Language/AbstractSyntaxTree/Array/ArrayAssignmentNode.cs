using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Assignment;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Array;

public class ArrayAssignmentNode : AssignmentBaseNode
{
    public AstNode Index { get; set; }

    public ArrayAssignmentNode(IdentifierNode identifier, AstNode index, AstNode value) : base(identifier, value)
    {
        Index = index;
        AddChild(index);
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitArrayAssignmentNode(this);
    }
}