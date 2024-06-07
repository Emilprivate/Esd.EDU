namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.PinExpr;

public class PinInNode : PinModeNode
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitPinInNode(this);
    }
}